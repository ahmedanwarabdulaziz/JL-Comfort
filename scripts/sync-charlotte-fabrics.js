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
 *                               (default: all three). Lets a run cover just one facet type
 *                               at a time — e.g. CF_SYNC_FACET_GROUPS=material — so a full
 *                               catalog sweep can be split into smaller manual phases instead
 *                               of one long run. Facet tags are merged into existing data,
 *                               never overwritten, so earlier phases' tags are preserved.
 *   CF_SYNC_LIMIT_FACETS     - optional integer; caps how many values per selected facet
 *                               group are crawled, for fast smoke-testing without doing a
 *                               full crawl.
 *
 * A run only marks missing products "inactive" when it covers all three facet groups with
 * no value limit (i.e. a genuine full sweep) — partial/phased runs only add and update, since
 * they never see enough of the catalog to safely tell what's actually gone.
 */

const admin = require('firebase-admin');
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

async function main() {
  initFirebase();
  const db = admin.firestore();
  const limitFacets = process.env.CF_SYNC_LIMIT_FACETS
    ? parseInt(process.env.CF_SYNC_LIMIT_FACETS, 10)
    : undefined;
  const selectedGroups = resolveSelectedFacetGroups();
  const isFullRun = ALL_FACET_GROUP_KEYS.every((key) => selectedGroups.includes(key)) && !limitFacets;
  console.log(
    `Facet groups this run: ${selectedGroups.join(', ')}${limitFacets ? ` (limited to ${limitFacets} value(s)/group)` : ''} — ${isFullRun ? 'full sweep' : 'partial phase'}`
  );

  const runRef = db.collection('charlotteFabricsSyncRuns').doc();
  const startedAt = nowTs();
  await runRef.set({
    startedAt,
    finishedAt: null,
    status: 'running',
    phase: 'crawling-facets',
    discovered: 0,
    totals: { scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0, structuralWarnings: 0 },
    errorLog: [],
    lastUpdatedAt: startedAt,
  });

  const totals = { scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0, structuralWarnings: 0 };
  const errorLog = [];

  try {
    console.log('Phase A: crawling selected facets...');
    const tagsByProduct = await crawlAllFacets(limitFacets, selectedGroups, totals);
    console.log(`Discovered ${tagsByProduct.size} unique products across facets.`);
    await runRef.update({ phase: 'fetching-products', discovered: tagsByProduct.size, lastUpdatedAt: nowTs() });

    console.log(`Phase B: fetching product pages for specs (${PRODUCT_CONCURRENCY} at a time)...`);
    const seenIds = new Set();
    const entries = Array.from(tagsByProduct.entries());
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
      console.log('Full sweep — diffing against previously active products...');
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
      console.log('Partial phase — skipping inactive-marking step (catalog coverage is incomplete this run).');
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
