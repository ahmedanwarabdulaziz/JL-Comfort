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

const BASE_URL = 'https://www.charlottefabrics.com/product-category/fabric/';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REQUEST_DELAY_MS = 300;
const MAX_PAGES_PER_FACET = 30; // safety cap against an infinite loop
const PAGE_SIZE = 48; // Charlotte Fabrics renders 48 products/page; a short page means "last page"

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function checkImageOk(imageUrl) {
  if (!imageUrl) return false;
  try {
    const res = await fetch(imageUrl, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT } });
    return res.ok;
  } catch {
    return false;
  }
}

function extractProductLinks(html) {
  const regex = /href="(https:\/\/www\.charlottefabrics\.com\/shop\/[^"]+)"\s+class="product-images"/g;
  const links = new Set();
  let match;
  while ((match = regex.exec(html)) !== null) {
    links.add(match[1]);
  }
  return Array.from(links);
}

function slugFromProductUrl(url) {
  const match = url.match(/\/shop\/([^/]+)\/?$/);
  return match ? match[1] : url;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Parses the schema.org Product JSON-LD block for name/sku/image/availability. */
function parseJsonLd(html) {
  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const nodes = data['@graph'] || [data];
      const product = nodes.find((n) => n['@type'] === 'Product');
      if (product) {
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        const availability = offer?.availability || '';
        return {
          name: product.name || '',
          sku: product.sku || '',
          imageUrl: product.image || '',
          availability: availability.includes('OutOfStock') ? 'OutOfStock' : 'InStock',
        };
      }
    } catch {
      // malformed block, try the next one
    }
  }
  return null;
}

/** Parses the product page's "Product Specs" table: left-side-specs / right-side-specs td pairs. */
function parseSpecTable(html) {
  const regex = /<td class="left-side-specs">([^<]*)<\/td><td class="right-side-specs">([^<]*)/g;
  const specs = {};
  let match;
  while ((match = regex.exec(html)) !== null) {
    const label = decodeEntities(match[1].trim());
    const value = decodeEntities(match[2].trim());
    if (label) specs[label] = value;
  }
  return specs;
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
async function crawlFacetValue(paramName, facetValue) {
  const productUrls = [];
  let page = 1;
  while (page <= MAX_PAGES_PER_FACET) {
    const basePath = page > 1 ? `${BASE_URL}page/${page}/` : BASE_URL;
    const url = `${basePath}?${paramName}=${encodeURIComponent(facetValue)}`;
    const html = await fetchHtml(url);
    await sleep(REQUEST_DELAY_MS);
    if (!html) break;
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

async function crawlAllFacets(limitFacets, selectedGroups) {
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
      const productUrls = await crawlFacetValue(group.param, option.value);
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
  const startedAt = admin.firestore.Timestamp.fromDate(new Date());
  await runRef.set({
    startedAt,
    finishedAt: null,
    status: 'running',
    totals: { scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0 },
    errorLog: [],
  });

  const totals = { scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0 };
  const errorLog = [];

  try {
    console.log('Phase A: crawling selected facets...');
    const tagsByProduct = await crawlAllFacets(limitFacets, selectedGroups);
    console.log(`Discovered ${tagsByProduct.size} unique products across facets.`);

    console.log('Phase B: fetching product pages for specs...');
    const seenIds = new Set();
    let count = 0;
    for (const [productUrl, tags] of tagsByProduct.entries()) {
      count += 1;
      const id = slugFromProductUrl(productUrl);
      seenIds.add(id);
      console.log(`[${count}/${tagsByProduct.size}] ${id}`);

      try {
        const html = await fetchHtml(productUrl);
        await sleep(REQUEST_DELAY_MS);
        if (!html) throw new Error('empty response fetching product page');

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
    }

    if (isFullRun) {
      console.log('Full sweep — diffing against previously active products...');
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
      finishedAt: admin.firestore.Timestamp.fromDate(new Date()),
      status: 'success',
      totals,
      errorLog,
    });

    console.log('Sync complete:', totals);
  } catch (err) {
    console.error('Sync failed:', err);
    await runRef.update({
      finishedAt: admin.firestore.Timestamp.fromDate(new Date()),
      status: 'failed',
      totals,
      errorLog: [...errorLog, err.message],
    });
    process.exitCode = 1;
  }
}

main();
