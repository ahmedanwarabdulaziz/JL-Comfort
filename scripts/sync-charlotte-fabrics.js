/**
 * Crawls charlottefabrics.com and syncs the catalog into Supabase, so the
 * bench-cushion fabric gallery can read from our own database instead of
 * live-scraping their site on every page view.
 *
 * Run manually:   node scripts/sync-charlotte-fabrics.js
 * Run in CI:       .github/workflows/sync-charlotte-fabrics.yml (manual trigger only —
 *                   "Run workflow" on GitHub, or the admin panel's "Run Sync Now" button)
 *
 * Env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - Supabase project + service-role key
 *                               (used in CI via scripts/lib/supabaseAdmin.js).
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
 * Discovery is always a full, unfiltered pagination pass through the catalog listing
 * (crawlFullCatalog), independent of CF_SYNC_FACET_GROUPS/CF_SYNC_LIMIT_FACETS. The listing does
 * NOT contain everything the supplier sells (on 2026-11-26 it left out 1,349 fabrics that still had
 * in-stock pages), so every active product it omits is also checked at its own address. A product
 * is marked "inactive" only when that page answers 404/410, and never more than MAX_REMOVAL_SHARE
 * of the active catalog in one run.
 *
 *   CF_SYNC_DRY_RUN=1             - report what a sync would add and retire; writes nothing.
 *   CF_SYNC_ALLOW_LARGE_REMOVAL=1 - retire products even above MAX_REMOVAL_SHARE.
 *
 * NOTE: CF_SYNC_LIMIT_FACETS does not make a run small -- every product is still written.
 */

const zlib = require('zlib');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSupabaseAdmin } = require('./lib/supabaseAdmin');
const { fetchAllRows } = require('./lib/fetchAllRows');
const {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
} = require('./lib/charlotteFabricFacets');
const {
  fetchWithRetry,
  fetchPage,
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
const PROGRESS_CHECKPOINT_INTERVAL = 10; // write live progress every N completed products
const DEACTIVATE_CHUNK_SIZE = 200; // ids travel in the URL, so keep each request short
const MAX_REMOVAL_SHARE = 0.05; // retiring more than this in one run is treated as a bad crawl
const MAX_ERROR_SHARE = 0.05; // above this the run is reported as failed
const SNAPSHOT_R2_KEY = 'catalog/charlotte-fabrics.json'; // public storefront reads this instead of querying the DB per visitor
const SNAPSHOT_CACHE_CONTROL = 'public, max-age=1800'; // 30 min — lets R2/Cloudflare's CDN and browsers cache it between syncs

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function totalsToColumns(totals) {
  return {
    scanned: totals.scanned,
    added: totals.added,
    updated: totals.updated,
    deactivated: totals.deactivated,
    broken_images: totals.brokenImages,
    errors: totals.errors,
    structural_warnings: totals.structuralWarnings,
  };
}

async function updateRun(supabase, runId, patch) {
  const { error } = await supabase.from('charlotte_fabric_sync_runs').update(patch).eq('id', runId);
  if (error) console.error('Failed to update sync run record:', error.message);
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
 * `complete` is true only if the end of the catalog was actually reached.
 */
async function crawlFullCatalog(totals) {
  let complete = false;
  const productUrls = [];
  const seen = new Set();
  let page = 1;
  while (page <= MAX_PAGES_PER_FACET) {
    const url = page > 1 ? `${BASE_URL}page/${page}/` : BASE_URL;
    const { status, html } = await fetchPage(url);
    await sleep(REQUEST_DELAY_MS);
    if (!html) {
      // A 404 after the first page is the end of the list; anything else is a failed fetch.
      complete = status === 404 && page > 1;
      if (!complete) console.warn(`Discovery stopped early: ${url} answered ${status || 'nothing'}.`);
      break;
    }
    if (!validateListingPage(html)) {
      totals.structuralWarnings += 1;
      console.warn(`Structural warning: unexpected listing page layout at ${url} — site markup may have changed.`);
      break;
    }
    const links = extractProductLinks(html);
    if (links.length === 0) {
      complete = page > 1;
      break;
    }
    for (const link of links) {
      if (!seen.has(link)) {
        seen.add(link);
        productUrls.push(link);
      }
    }
    if (links.length < PAGE_SIZE) {
      complete = true;
      break;
    }
    page += 1;
  }
  return { productUrls, complete };
}

const productUrlFor = (id) => `https://www.charlottefabrics.com/shop/${id}/`;
const isGone = (status) => status === 404 || status === 410;

/** Which products to retire: those whose own page is gone, unless there are suspiciously many. */
function planRemoval(activeIds, goneIds) {
  const gone = activeIds.filter((id) => goneIds.has(id));
  const allowLarge = process.env.CF_SYNC_ALLOW_LARGE_REMOVAL === '1';
  if (!allowLarge && gone.length > activeIds.length * MAX_REMOVAL_SHARE) {
    return { ids: [], skipped: `${gone.length} of ${activeIds.length} active product pages are gone, over the ${MAX_REMOVAL_SHARE * 100}% limit` };
  }
  return { ids: gone, skipped: null };
}

/** Reads the catalog and a few product pages and prints what a real run would change. No writes. */
async function dryRun(supabase) {
  const totals = { structuralWarnings: 0 };
  console.log('DRY RUN: nothing will be written.');
  const { productUrls, complete } = await crawlFullCatalog(totals);
  const found = new Map(productUrls.map((url) => [slugFromProductUrl(url), url]));
  const rows = await fetchAllRows(() => supabase.from('charlotte_fabrics').select('id, legacy_id, status'));
  const known = new Map(rows.map((row) => [row.legacy_id, row.status]));
  const activeIds = rows.filter((row) => row.status === 'active').map((row) => row.legacy_id);
  const added = [...found.keys()].filter((id) => !known.has(id));
  const returning = [...found.keys()].filter((id) => known.has(id) && known.get(id) !== 'active');
  const unlisted = activeIds.filter((id) => !found.has(id));

  console.log(`Supplier lists ${found.size} products (${complete ? 'complete' : 'INCOMPLETE'}); database has ${activeIds.length} active.`);
  console.log(`Would add ${added.length} new: ${added.slice(0, 10).join(', ')}`);
  console.log(`Would reactivate ${returning.length}.`);
  const checked = unlisted.filter((_, i) => i % Math.max(1, Math.ceil(unlisted.length / 40)) === 0);
  let gone = 0;
  for (const id of checked) {
    const { status } = await fetchPage(productUrlFor(id));
    await sleep(REQUEST_DELAY_MS);
    if (isGone(status)) gone += 1;
  }
  console.log(`${unlisted.length} active products are not in the listing; a real run checks each one's own page.`);
  console.log(`Spot check: ${gone} of ${checked.length} of those pages are gone (only gone pages are retired).`);

  let parsed = 0;
  const sample = productUrls.filter((_, i) => i % Math.max(1, Math.floor(productUrls.length / 5)) === 0).slice(0, 5);
  for (const url of sample) {
    const html = await fetchWithRetry(url);
    await sleep(REQUEST_DELAY_MS);
    const jsonLd = html ? parseJsonLd(html) : null;
    if (jsonLd?.name && jsonLd?.imageUrl) parsed += 1;
  }
  console.log(`Product pages that parse correctly: ${parsed} of ${sample.length}.`);
  if (!complete || parsed < sample.length) process.exitCode = 1;
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
 * querying the database or scraping charlottefabrics.com live on every visitor request.
 */
async function publishSnapshot(supabase) {
  const r2 = buildR2Client();
  if (!r2) {
    console.warn(
      'Skipping snapshot publish — Cloudflare R2 env vars not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_R2_S3_API_URL / CLOUDFLARE_R2_ACCESS_KEY_ID / CLOUDFLARE_R2_SECRET_ACCESS_KEY).'
    );
    return { published: false };
  }

  // Resolve each item's price once, here, so every downstream reader (gallery, checkout,
  // fabric-search) just reads a ready-to-use number/name. Precedence: a manual admin override
  // always wins, then the real per-SKU retail price from the master spreadsheet import, then the
  // flat price-tag rate as a last resort — mirrors lib/data/charlotteFabricPricing.ts's
  // resolveEffectivePrice (this script is plain Node/CommonJS and can't require() that .ts file,
  // so keep this in sync with it by hand). Anything still unpriced is filtered out below, since it
  // has nothing to charge a customer and shouldn't be shown on the storefront.
  const { data: priceTagRows, error: priceTagsError } = await supabase
    .from('fabric_price_tags')
    .select('id, name, price_per_yard');
  if (priceTagsError) throw priceTagsError;
  const priceTagsById = new Map(
    (priceTagRows || []).map((tag) => [tag.id, { name: tag.name, pricePerYard: tag.price_per_yard }])
  );
  const resolveEffectivePrice = (data) => {
    if (data.manual_retail_price != null) return { pricePerYard: data.manual_retail_price, priceTagName: null };
    if (data.retail_price != null) return { pricePerYard: data.retail_price, priceTagName: null };
    const tag = data.price_tag_id ? priceTagsById.get(data.price_tag_id) : null;
    return { pricePerYard: tag?.pricePerYard ?? null, priceTagName: tag?.name ?? null };
  };

  // Must page through — a plain select is silently capped at 1000 rows by PostgREST, which used to
  // truncate this snapshot to the first 1000 of ~7000 fabrics (see fetchAllRows).
  const fabricRows = await fetchAllRows(() =>
    supabase.from('charlotte_fabrics').select('*, fabric_group_members(group_id)').eq('status', 'active')
  );

  const allItems = fabricRows.map((data) => {
    const effectivePrice = resolveEffectivePrice(data);
    return {
      id: data.legacy_id,
      name: data.name || '',
      sku: data.sku || '',
      productUrl: data.product_url || '',
      imageUrl: data.image_url || '',
      imageOk: data.image_ok ?? true,
      color: data.color || [],
      pattern: data.pattern || [],
      material: data.material || [],
      applications: data.applications || [],
      markets: data.markets || [],
      fiberContent: data.fiber_content || '',
      durability: data.durability || '',
      width: data.width || '',
      repeat: data.repeat || '',
      patternDirection: data.pattern_direction || '',
      cleanability: data.cleanability || '',
      flammability: data.flammability || '',
      origin: data.origin || '',
      features: data.features || '',
      performance: data.performance || '',
      // Master-spreadsheet tags behind the shop's Features filter (Pet Friendly, Greenguard Gold...).
      properties: data.properties || [],
      // Raw specs catch-all is dropped from the public snapshot — every field the gallery UI
      // actually reads is already flattened above, and specs roughly doubles the payload size
      // (this file is ~10MB with it; every visitor's browser and every fabric-search API call
      // pays for that). The database itself still keeps the raw specs — the admin table reads
      // those directly via getCharlotteFabrics(), unaffected by this trim.
      availability: data.availability || 'InStock',
      status: data.status || 'active',
      firstSeenAt: data.first_seen_at || null,
      lastSeenAt: data.last_seen_at || null,
      lastCheckedAt: data.last_checked_at || null,
      priceTagId: data.price_tag_id || null,
      groupIds: (data.fabric_group_members || []).map((m) => m.group_id),
      sampleBooks: data.sample_books || [],
      colorwayGroup: data.colorway_group || null, // shop cards show other colourways of the pattern
      isNew: !!data.is_new,
      pricePerYard: effectivePrice.pricePerYard,
      priceTagName: effectivePrice.priceTagName,
    };
  });

  // Unpriced items (no price tag assigned) are excluded from the public snapshot entirely —
  // customers never see a fabric with no price. They're still fully visible/editable in the
  // admin catalog table, which reads the database directly rather than this snapshot.
  const items = allItems.filter((item) => item.pricePerYard != null);
  const unpricedCount = allItems.length - items.length;
  if (unpricedCount > 0) {
    console.log(`${unpricedCount} active product(s) have no price tag — excluded from the published snapshot.`);
  }

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

  console.log(`Published snapshot: ${items.length} priced product(s) to ${SNAPSHOT_R2_KEY} (${gzipped.length} bytes gzipped)`);
  return { published: true, count: items.length };
}

async function main() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).');
    process.exitCode = 1;
    return;
  }

  if (process.env.CF_SYNC_DRY_RUN === '1') {
    await dryRun(supabase);
    return;
  }

  const limitFacets = process.env.CF_SYNC_LIMIT_FACETS
    ? parseInt(process.env.CF_SYNC_LIMIT_FACETS, 10)
    : undefined;
  const selectedGroups = resolveSelectedFacetGroups();
  console.log(
    `Facet groups this run (tagging scope): ${selectedGroups.join(', ')}${limitFacets ? ` (limited to ${limitFacets} value(s)/group)` : ''}`
  );

  const startedAtIso = new Date().toISOString();
  const { data: runRow, error: runInsertError } = await supabase
    .from('charlotte_fabric_sync_runs')
    .insert({
      started_at: startedAtIso,
      finished_at: null,
      status: 'running',
      phase: 'discovering-catalog',
      discovered: 0,
      ...totalsToColumns({ scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0, structuralWarnings: 0 }),
      error_log: [],
      last_updated_at: startedAtIso,
    })
    .select('id')
    .single();

  if (runInsertError) {
    console.error('Failed to create sync run record:', runInsertError.message);
    process.exitCode = 1;
    return;
  }
  const runId = runRow.id;

  const totals = { scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0, structuralWarnings: 0 };
  const errorLog = [];

  try {
    console.log('Discovering full catalog (unfiltered pagination)...');
    const { productUrls: allProductUrls, complete: isFullRun } = await crawlFullCatalog(totals);
    if (allProductUrls.length === 0) throw new Error('Discovery found no products');
    console.log(
      `Discovered ${allProductUrls.length} unique products via full catalog pagination${isFullRun ? '' : ' (INCOMPLETE — did not reach the end of the catalog)'}.`
    );
    await updateRun(supabase, runId, { phase: 'crawling-facets', last_updated_at: new Date().toISOString() });

    console.log('Phase A: crawling selected facets for tags...');
    const tagsByProduct = await crawlAllFacets(limitFacets, selectedGroups, totals);

    // Active products the listing leaves out are checked at their own address (see top of file).
    const activeRows = await fetchAllRows(() =>
      supabase.from('charlotte_fabrics').select('id, legacy_id, product_url').eq('status', 'active')
    );
    const listedIds = new Set(allProductUrls.map(slugFromProductUrl));
    const unlistedUrls = activeRows
      .filter((row) => !listedIds.has(row.legacy_id))
      .map((row) => row.product_url || productUrlFor(row.legacy_id));
    console.log(`${unlistedUrls.length} active product(s) are not in the listing — checking their own pages.`);

    // Merge: every product the full-catalog pass found gets processed, tagged with whatever
    // the facet crawl matched this run — empty tags (not dropped) if nothing matched.
    let untaggedCount = 0;
    const entries = [...allProductUrls, ...unlistedUrls].map((url) => {
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
    await updateRun(supabase, runId, { phase: 'fetching-products', discovered: entries.length, last_updated_at: new Date().toISOString() });

    console.log(`Phase B: fetching product pages for specs (${PRODUCT_CONCURRENCY} at a time)...`);
    const goneIds = new Set();
    let nextIndex = 0;
    let completed = 0;

    const processOne = async (productUrl, tags) => {
      const id = slugFromProductUrl(productUrl);

      try {
        const { status, html } = await fetchPage(productUrl);
        await sleep(REQUEST_DELAY_MS);
        if (isGone(status)) {
          goneIds.add(id); // retired below, if there aren't suspiciously many
        } else {
          if (!html) throw new Error('empty response fetching product page');
          if (!validateProductPage(html)) {
            totals.structuralWarnings += 1;
            throw new Error('unexpected product page layout — site markup may have changed');
          }

          const jsonLd = parseJsonLd(html);
          // Without these the update below would blank a good row: keep what we have instead.
          if (!jsonLd?.name || !jsonLd?.imageUrl) throw new Error('product page has no name or photo');
          const specs = parseSpecTable(html);
          const flattened = flattenSpecs(specs);
          const imageUrl = jsonLd.imageUrl;
          const imageOk = await checkImageOk(imageUrl);
          if (!imageOk) totals.brokenImages += 1;

          const { data: existing, error: fetchError } = await supabase
            .from('charlotte_fabrics')
            .select('color, pattern, material')
            .eq('legacy_id', id)
            .maybeSingle();
          if (fetchError) throw fetchError;

          const nowIso = new Date().toISOString();

          // Merge (never overwrite) facet tags, so a partial run — e.g. material-only — can't
          // wipe out color/pattern tags a previous phase already found for this product.
          const mergeTags = (existingValues, newSet) =>
            Array.from(new Set([...(existingValues || []), ...newSet]));

          const data = {
            legacy_id: id,
            name: jsonLd?.name || '',
            sku: jsonLd?.sku || '',
            product_url: productUrl,
            image_url: imageUrl,
            image_ok: imageOk,
            color: mergeTags(existing?.color, tags.color),
            pattern: mergeTags(existing?.pattern, tags.pattern),
            material: mergeTags(existing?.material, tags.material),
            // A page without a spec table leaves the stored specs alone.
            ...(Object.keys(specs).length > 0 && {
              applications: flattened.applications,
              markets: flattened.markets,
              fiber_content: flattened.fiberContent,
              durability: flattened.durability,
              width: flattened.width,
              repeat: flattened.repeat,
              pattern_direction: flattened.patternDirection,
              cleanability: flattened.cleanability,
              flammability: flattened.flammability,
              origin: flattened.origin,
              features: flattened.features,
              performance: flattened.performance,
              specs,
            }),
            availability: jsonLd?.availability || 'InStock',
            status: 'active',
            last_seen_at: nowIso,
            last_checked_at: nowIso,
          };

          if (existing) {
            const { error: updateError } = await supabase.from('charlotte_fabrics').update(data).eq('legacy_id', id);
            if (updateError) throw updateError;
            totals.updated += 1;
          } else {
            const { error: insertError } = await supabase
              .from('charlotte_fabrics')
              .insert({ ...data, first_seen_at: nowIso });
            if (insertError) throw insertError;
            totals.added += 1;
          }
          totals.scanned += 1;
        }
      } catch (err) {
        totals.errors += 1;
        errorLog.push(`${id}: ${err.message}`);
        console.error(`Error processing ${id}:`, err.message);
      }

      completed += 1;
      console.log(`[${completed}/${entries.length}] ${id}`);
      if (completed % PROGRESS_CHECKPOINT_INTERVAL === 0 || completed === entries.length) {
        // Best-effort progress checkpoint — a failed write here shouldn't fail the run.
        supabase
          .from('charlotte_fabric_sync_runs')
          .update({ ...totalsToColumns(totals), last_updated_at: new Date().toISOString() })
          .eq('id', runId)
          .then(({ error }) => {
            if (error) console.error('Checkpoint write failed:', error.message);
          });
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

    await updateRun(supabase, runId, { phase: 'diffing', last_updated_at: new Date().toISOString() });
    const removal = planRemoval(activeRows.map((row) => row.legacy_id), goneIds);
    const problems = [];
    if (!isFullRun) problems.push('discovery did not reach the end of the catalog: new products may be missing');
    if (removal.skipped) problems.push(`no products retired: ${removal.skipped}`);

    for (let i = 0; i < removal.ids.length; i += DEACTIVATE_CHUNK_SIZE) {
      const idsChunk = removal.ids.slice(i, i + DEACTIVATE_CHUNK_SIZE);
      const { error: deactivateError } = await supabase
        .from('charlotte_fabrics')
        .update({ status: 'inactive' })
        .in('legacy_id', idsChunk);
      if (deactivateError) throw deactivateError;
      totals.deactivated += idsChunk.length;
    }

    try {
      const { published } = await publishSnapshot(supabase);
      if (!published) problems.push('snapshot not published: R2 is not configured');
    } catch (err) {
      console.error('Failed to publish catalog snapshot to R2:', err.message);
      problems.push(`snapshot-publish: ${err.message}`);
    }

    if (totals.errors > entries.length * MAX_ERROR_SHARE) {
      problems.push(`${totals.errors} of ${entries.length} products failed`);
    }

    // Anything that left the shop out of date must show as a failed run, not a quiet success.
    if (problems.length > 0) {
      console.error(`Sync finished with problems: ${problems.join('; ')}`);
      process.exitCode = 1;
    }
    await updateRun(supabase, runId, {
      finished_at: new Date().toISOString(),
      status: problems.length > 0 ? 'failed' : 'success',
      phase: 'done',
      ...totalsToColumns(totals),
      error_log: [...problems, ...errorLog],
      last_updated_at: new Date().toISOString(),
    });

    console.log('Sync complete:', totals);
  } catch (err) {
    console.error('Sync failed:', err);
    await updateRun(supabase, runId, {
      finished_at: new Date().toISOString(),
      status: 'failed',
      phase: 'done',
      ...totalsToColumns(totals),
      error_log: [...errorLog, err.message],
      last_updated_at: new Date().toISOString(),
    });
    process.exitCode = 1;
  }
}

// Only auto-run when executed directly (`node scripts/sync-charlotte-fabrics.js`), not when
// required as a module (e.g. by scripts/publish-fabric-pricing.js, which just wants
// publishSnapshot without triggering a full site crawl).
if (require.main === module) {
  main();
}

module.exports = { publishSnapshot, main };
