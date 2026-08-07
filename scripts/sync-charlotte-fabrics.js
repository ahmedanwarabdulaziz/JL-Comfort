/**
 * Crawls charlottefabrics.com and syncs the catalog into Firestore, so the
 * bench-cushion fabric gallery can read from our own database instead of
 * live-scraping their site on every page view.
 *
 * Run manually:   node scripts/sync-charlotte-fabrics.js
 * Run in CI:       .github/workflows/sync-charlotte-fabrics.yml (manual trigger only —
 *                   "Run workflow" on GitHub, or the admin panel's "Run Sync Now" button)
 *
 * Env vars:
 *   FIREBASE_SERVICE_ACCOUNT - JSON string of the service account (used in CI).
 *                               Falls back to the local service account file used
 *                               by scripts/setup-admin-user.js when unset.
 *   CF_SYNC_FACET_GROUPS     - optional comma-separated subset of "color,pattern,material"
 *                               (default: all three). Scopes which facet TAGS get crawled/
 *                               attached this run — e.g. CF_SYNC_FACET_GROUPS=material — so
 *                               tagging can be split into smaller manual phases instead of one
 *                               long run. Facet tags are merged into existing data, never
 *                               overwritten, so earlier phases' tags are preserved. Does NOT
 *                               affect product discovery (see below) — every run still finds
 *                               and processes every product in the catalog.
 *   CF_SYNC_LIMIT_FACETS     - optional integer; caps how many values per selected facet
 *                               group are crawled, for fast smoke-testing without doing a
 *                               full crawl.
 *
 * Product discovery is always a full, unfiltered pagination pass through the catalog listing
 * (crawlFullCatalog) — this is the authoritative "every product that exists" list, independent
 * of CF_SYNC_FACET_GROUPS/CF_SYNC_LIMIT_FACETS and independent of whether the curated facet
 * value lists in lib/charlotteFabricFacets.js happen to cover every product's tags. Because
 * discovery is always complete, every run (even a facet-limited one) safely marks genuinely
 * removed products "inactive" — unless the discovery pass itself hit a structural warning
 * (site markup changed), in which case that step is skipped for that run.
 */

const zlib = require('zlib');
const admin = require('firebase-admin');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
} = require('./lib/charlotteFabricFacets');
const {
  fetchWithRetry,
  checkImageOk,
  extractProductLinks,
  validateListingPage,
  parseJsonLd,
  parseSpecTable,
  validateProductPage,
} = require('./lib/charlotteFabricsScraper');

const BASE_URL = 'https://www.charlottefabrics.com/product-category/fabric/';
const REQUEST_DELAY_MS = 250;
const MAX_PAGES_PER_FACET = 250; // safety cap against an infinite loop; catalog is ~150 pages, some facets (e.g. Abstract & Geometric) alone need ~35
const PAGE_SIZE = 48; // Charlotte Fabrics renders 48 products/page; a short page means "last page"
const PRODUCT_CONCURRENCY = 6; // Phase B fetches this many product pages in parallel
const PROGRESS_CHECKPOINT_INTERVAL = 10; // write live progress to Firestore every N completed products
const SNAPSHOT_R2_KEY = 'catalog/charlotte-fabrics.json'; // public storefront reads this instead of querying Firestore per visitor
const SNAPSHOT_CACHE_CONTROL = 'public, max-age=1800'; // 30 min — lets R2/Cloudflare's CDN and browsers cache it between syncs

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowTs() {
  return admin.firestore.Timestamp.fromDate(new Date());
}

function initFirebase() {
  if (admin.apps.length) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const serviceAccount = require('../jl-comfort-firebase-adminsdk-fbsvc-0010276dc8.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

function slugFromProductUrl(url) {
  const match = url.match(/\/shop\/([^/]+)\/?$/);
  return match ? match[1] : url;
}

function splitList(value) {
  if (!value) return [];
  return value
    .split(/,|&/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Flattens the most commonly-present spec labels into dedicated fields for easy filtering. */
function flattenSpecs(specs) {
  return {
    applications: splitList(specs['Applications']),
    markets: splitList(specs['Markets']),
    fiberContent: specs['Content'] || '',
    durability: specs['Durability'] || '',
    width: specs['Width'] || '',
    repeat: specs['Repeat'] || '',
    patternDirection: specs['Pattern Direction'] || '',
    cleanability: specs['Cleanability'] || '',
    flammability: specs['Flammability'] || '',
    origin: specs['Origin'] || '',
    features: specs['Features'] || '',
    performance: specs['Performance'] || '',
  };
}

/** Phase A: crawl every color/pattern/material facet value and record which products appear under each. */
async function crawlFacetValue(paramName, facetValue, totals) {
  const productUrls = [];
  let page = 1;
  while (page <= MAX_PAGES_PER_FACET) {
    const basePath = page > 1 ? `${BASE_URL}page/${page}/` : BASE_URL;
    const url = `${basePath}?${paramName}=${encodeURIComponent(facetValue)}`;
    const html = await fetchWithRetry(url);
    await sleep(REQUEST_DELAY_MS);
    if (!html) break;
    if (!validateListingPage(html)) {
      totals.structuralWarnings += 1;
      console.warn(`Structural warning: unexpected listing page layout at ${url} — site markup may have changed.`);
      break;
    }
    const links = extractProductLinks(html);
    if (links.length === 0) break;
    productUrls.push(...links);
    if (links.length < PAGE_SIZE) break;
    page += 1;
  }
  return productUrls;
}

/**
 * Discovery: paginate the full unfiltered catalog listing. This is the authoritative list of
 * every product currently in the catalog — independent of whether the curated facet value lists
 * in charlotteFabricFacets.js happen to cover every product's color/pattern/material. A product
 * missing from those lists would otherwise never be discovered by the facet crawl below.
 */
async function crawlFullCatalog(totals) {
  const productUrls = [];
  const seen = new Set();
  let page = 1;
  while (page <= MAX_PAGES_PER_FACET) {
    const url = page > 1 ? `${BASE_URL}page/${page}/` : BASE_URL;
    const html = await fetchWithRetry(url);
    await sleep(REQUEST_DELAY_MS);
    if (!html) break;
    if (!validateListingPage(html)) {
      totals.structuralWarnings += 1;
      console.warn(`Structural warning: unexpected listing page layout at ${url} — site markup may have changed.`);
      break;
    }
    const links = extractProductLinks(html);
    if (links.length === 0) break;
    for (const link of links) {
      if (!seen.has(link)) {
        seen.add(link);
        productUrls.push(link);
      }
    }
    if (links.length < PAGE_SIZE) break;
    page += 1;
  }
  return productUrls;
}

const ALL_FACET_GROUP_KEYS = ['color', 'pattern', 'material'];

function resolveSelectedFacetGroups() {
  if (!process.env.CF_SYNC_FACET_GROUPS) return ALL_FACET_GROUP_KEYS;
  const requested = process.env.CF_SYNC_FACET_GROUPS.split(',').map((s) => s.trim()).filter(Boolean);
  const valid = requested.filter((key) => ALL_FACET_GROUP_KEYS.includes(key));
  return valid.length > 0 ? valid : ALL_FACET_GROUP_KEYS;
}

async function crawlAllFacets(limitFacets, selectedGroups, totals) {
  const facetGroups = [
    { param: '_color', values: CHARLOTTE_FABRIC_COLORS, key: 'color' },
    { param: '_pattern', values: CHARLOTTE_FABRIC_PATTERNS, key: 'pattern' },
    { param: '_material', values: CHARLOTTE_FABRIC_MATERIALS, key: 'material' },
  ].filter((group) => selectedGroups.includes(group.key));

  const tagsByProduct = new Map();

  for (const group of facetGroups) {
    const values = limitFacets ? group.values.slice(0, limitFacets) : group.values;
    for (const option of values) {
      console.log(`Crawling facet ${group.param}=${option.value}...`);
      const productUrls = await crawlFacetValue(group.param, option.value, totals);
      for (const url of productUrls) {
        if (!tagsByProduct.has(url)) {
          tagsByProduct.set(url, { color: new Set(), pattern: new Set(), material: new Set() });
        }
        tagsByProduct.get(url)[group.key].add(option.value);
      }
    }
  }

  return tagsByProduct;
}

/**
 * R2 client setup — mirrors lib/cloudflare/r2.ts, re-declared here because this script runs via
 * plain `node`, outside the Next.js/TypeScript build pipeline that file lives in.
 */
function buildR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'jl-comfort';
  const s3ApiUrl = process.env.CLOUDFLARE_R2_S3_API_URL;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !s3ApiUrl || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: s3ApiUrl,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { client, bucketName };
}

/**
 * Publishes a static JSON snapshot of the active catalog to R2, so the public storefront
 * (bench-cushion fabric gallery, fabric-search API) can read a CDN-cached file instead of
 * querying Firestore or scraping charlottefabrics.com live on every visitor request.
 */
async function publishSnapshot(db) {
  const r2 = buildR2Client();
  if (!r2) {
    console.warn(
      'Skipping snapshot publish — Cloudflare R2 env vars not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_R2_S3_API_URL / CLOUDFLARE_R2_ACCESS_KEY_ID / CLOUDFLARE_R2_SECRET_ACCESS_KEY).'
    );
    return { published: false };
  }

  const toIso = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : null);
  const activeSnapshot = await db.collection('charlotteFabrics').where('status', '==', 'active').get();
  const items = activeSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      sku: data.sku || '',
      productUrl: data.productUrl || '',
      imageUrl: data.imageUrl || '',
      imageOk: data.imageOk ?? true,
      color: data.color || [],
      pattern: data.pattern || [],
      material: data.material || [],
      applications: data.applications || [],
      markets: data.markets || [],
      fiberContent: data.fiberContent || '',
      durability: data.durability || '',
      width: data.width || '',
      repeat: data.repeat || '',
      patternDirection: data.patternDirection || '',
      cleanability: data.cleanability || '',
      flammability: data.flammability || '',
      origin: data.origin || '',
      features: data.features || '',
      performance: data.performance || '',
      // Raw specs catch-all is dropped from the public snapshot — every field the gallery UI
      // actually reads is already flattened above, and specs roughly doubles the payload size
      // (this file is ~10MB with it; every visitor's browser and every fabric-search API call
      // pays for that). Firestore itself still keeps the raw specs — the admin table reads
      // those directly via getCharlotteFabrics(), unaffected by this trim.
      availability: data.availability || 'InStock',
      status: data.status || 'active',
      firstSeenAt: toIso(data.firstSeenAt),
      lastSeenAt: toIso(data.lastSeenAt),
      lastCheckedAt: toIso(data.lastCheckedAt),
    };
  });

  // pub-*.r2.dev doesn't apply on-the-fly compression, so a ~6-10MB raw JSON snapshot means a
  // slow fetch for every visitor. Gzip it ourselves — fetch() (browser and Node) transparently
  // decompresses a Content-Encoding: gzip response, so no change is needed on the read side.
  const gzipped = zlib.gzipSync(JSON.stringify(items));

  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucketName,
      Key: SNAPSHOT_R2_KEY,
      Body: gzipped,
      ContentType: 'application/json',
      ContentEncoding: 'gzip',
      CacheControl: SNAPSHOT_CACHE_CONTROL,
    })
  );

  console.log(`Published snapshot: ${items.length} active product(s) to ${SNAPSHOT_R2_KEY} (${gzipped.length} bytes gzipped)`);
  return { published: true, count: items.length };
}

async function main() {
  initFirebase();
  const db = admin.firestore();
  const limitFacets = process.env.CF_SYNC_LIMIT_FACETS
    ? parseInt(process.env.CF_SYNC_LIMIT_FACETS, 10)
    : undefined;
  const selectedGroups = resolveSelectedFacetGroups();
  console.log(
    `Facet groups this run (tagging scope): ${selectedGroups.join(', ')}${limitFacets ? ` (limited to ${limitFacets} value(s)/group)` : ''}`
  );

  const runRef = db.collection('charlotteFabricsSyncRuns').doc();
  const startedAt = nowTs();
  await runRef.set({
    startedAt,
    finishedAt: null,
    status: 'running',
    phase: 'discovering-catalog',
    discovered: 0,
    totals: { scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0, structuralWarnings: 0 },
    errorLog: [],
    lastUpdatedAt: startedAt,
  });

  const totals = { scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0, structuralWarnings: 0 };
  const errorLog = [];

  try {
    console.log('Discovering full catalog (unfiltered pagination)...');
    const structuralWarningsBeforeDiscovery = totals.structuralWarnings;
    const allProductUrls = await crawlFullCatalog(totals);
    const isFullRun = totals.structuralWarnings === structuralWarningsBeforeDiscovery;
    console.log(
      `Discovered ${allProductUrls.length} unique products via full catalog pagination${isFullRun ? '' : ' (INCOMPLETE — structural warning encountered, coverage not guaranteed)'}.`
    );
    await runRef.update({
      phase: 'crawling-facets',
      lastUpdatedAt: nowTs(),
    });

    console.log('Phase A: crawling selected facets for tags...');
    const tagsByProduct = await crawlAllFacets(limitFacets, selectedGroups, totals);

    // Merge: every product the full-catalog pass found gets processed, tagged with whatever
    // the facet crawl matched this run — empty tags (not dropped) if nothing matched.
    let untaggedCount = 0;
    const entries = allProductUrls.map((url) => {
      const tags = tagsByProduct.get(url);
      if (!tags) untaggedCount += 1;
      return [url, tags || { color: new Set(), pattern: new Set(), material: new Set() }];
    });
    if (untaggedCount > 0) {
      console.log(
        `${untaggedCount} product(s) discovered but not matched to any crawled facet value this run — writing with empty tags. If this number is large, charlotteFabricFacets.js may be missing a facet value.`
      );
    }
    console.log(`Discovered ${entries.length} unique products total.`);
    await runRef.update({ phase: 'fetching-products', discovered: entries.length, lastUpdatedAt: nowTs() });

    console.log(`Phase B: fetching product pages for specs (${PRODUCT_CONCURRENCY} at a time)...`);
    const seenIds = new Set();
    let nextIndex = 0;
    let completed = 0;

    const processOne = async (productUrl, tags) => {
      const id = slugFromProductUrl(productUrl);
      seenIds.add(id);

      try {
        const html = await fetchWithRetry(productUrl);
        await sleep(REQUEST_DELAY_MS);
        if (!html) throw new Error('empty response fetching product page');
        if (!validateProductPage(html)) {
          totals.structuralWarnings += 1;
          throw new Error('unexpected product page layout — site markup may have changed');
        }

        const jsonLd = parseJsonLd(html);
        const specs = parseSpecTable(html);
        const flattened = flattenSpecs(specs);
        const imageUrl = jsonLd?.imageUrl || '';
        const imageOk = await checkImageOk(imageUrl);
        if (!imageOk) totals.brokenImages += 1;

        const docRef = db.collection('charlotteFabrics').doc(id);
        const existing = await docRef.get();
        const existingData = existing.exists ? existing.data() : null;
        const now = admin.firestore.Timestamp.fromDate(new Date());

        // Merge (never overwrite) facet tags, so a partial run — e.g. material-only — can't
        // wipe out color/pattern tags a previous phase already found for this product.
        const mergeTags = (existingValues, newSet) =>
          Array.from(new Set([...(existingValues || []), ...newSet]));

        const data = {
          name: jsonLd?.name || '',
          sku: jsonLd?.sku || '',
          productUrl,
          imageUrl,
          imageOk,
          color: mergeTags(existingData?.color, tags.color),
          pattern: mergeTags(existingData?.pattern, tags.pattern),
          material: mergeTags(existingData?.material, tags.material),
          ...flattened,
          specs,
          availability: jsonLd?.availability || 'InStock',
          status: 'active',
          lastSeenAt: now,
          lastCheckedAt: now,
        };

        if (existing.exists) {
          await docRef.update(data);
          totals.updated += 1;
        } else {
          await docRef.set({ ...data, firstSeenAt: now });
          totals.added += 1;
        }
        totals.scanned += 1;
      } catch (err) {
        totals.errors += 1;
        errorLog.push(`${id}: ${err.message}`);
        console.error(`Error processing ${id}:`, err.message);
      }

      completed += 1;
      console.log(`[${completed}/${entries.length}] ${id}`);
      if (completed % PROGRESS_CHECKPOINT_INTERVAL === 0 || completed === entries.length) {
        // Best-effort progress checkpoint — a failed write here shouldn't fail the run.
        runRef.update({ totals, lastUpdatedAt: nowTs() }).catch(() => {});
      }
    };

    const worker = async () => {
      while (nextIndex < entries.length) {
        const myIndex = nextIndex;
        nextIndex += 1;
        const [productUrl, tags] = entries[myIndex];
        await processOne(productUrl, tags);
      }
    };

    await Promise.all(Array.from({ length: PRODUCT_CONCURRENCY }, () => worker()));

    if (isFullRun) {
      console.log('Full catalog coverage confirmed — diffing against previously active products...');
      await runRef.update({ phase: 'diffing', lastUpdatedAt: nowTs() });
      const activeSnapshot = await db.collection('charlotteFabrics').where('status', '==', 'active').get();
      let batch = db.batch();
      let batchCount = 0;
      for (const doc of activeSnapshot.docs) {
        if (!seenIds.has(doc.id)) {
          batch.update(doc.ref, { status: 'inactive' });
          totals.deactivated += 1;
          batchCount += 1;
          if (batchCount >= 400) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      }
      if (batchCount > 0) await batch.commit();
    } else {
      console.log('Full-catalog discovery hit a structural warning — skipping inactive-marking step (coverage not guaranteed this run).');
    }

    try {
      await publishSnapshot(db);
    } catch (err) {
      console.error('Failed to publish catalog snapshot to R2:', err.message);
      errorLog.push(`snapshot-publish: ${err.message}`);
    }

    await runRef.update({
      finishedAt: nowTs(),
      status: 'success',
      phase: 'done',
      totals,
      errorLog,
      lastUpdatedAt: nowTs(),
    });

    console.log('Sync complete:', totals);
  } catch (err) {
    console.error('Sync failed:', err);
    await runRef.update({
      finishedAt: nowTs(),
      status: 'failed',
      phase: 'done',
      totals,
      errorLog: [...errorLog, err.message],
      lastUpdatedAt: nowTs(),
    });
    process.exitCode = 1;
  }
}

main();
