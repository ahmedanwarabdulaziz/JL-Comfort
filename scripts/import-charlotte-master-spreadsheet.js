/**
 * Merges the "Current Patterns" tab of the Charlotte Fabrics master spreadsheet into the
 * `charlotte_fabrics` Supabase table, matched by SKU. Adds fields the website scraper can't
 * get (real cost/MAP/retail pricing, colorway group, brand, sample book, eco certs, construction
 * type, properties, new-item flag) onto existing rows — never overwrites or blanks anything.
 *
 * A SKU with no matching row (e.g. Vinyl-category rows, since Vinyl isn't crawled today)
 * is skipped entirely and reported, not written. A row whose SKU has no match in the sheet
 * is left completely untouched.
 *
 * Run (dry-run, default):  node scripts/import-charlotte-master-spreadsheet.js
 * Run (commits writes):    node scripts/import-charlotte-master-spreadsheet.js --write
 * Custom file path:        node scripts/import-charlotte-master-spreadsheet.js --file path/to.xlsx
 *
 * Env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - Supabase project + service-role key.
 */

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { getSupabaseAdmin } = require('./lib/supabaseAdmin');

const SHEET_NAME = 'Current Patterns';
const DEFAULT_FILE = path.join(__dirname, '../data/charlotte-fabrics/master-spreadsheet.xlsx');
const REPORT_FILE = path.join(__dirname, '../data/charlotte-fabrics/unmatched-skus.json');
const UPDATE_CONCURRENCY = 50; // no Firestore-style batch-op cap in Postgres; this just keeps us from hammering PostgREST with 7,000 simultaneous single-row updates

function parseArgs(argv) {
  const write = argv.includes('--write');
  const fileFlagIndex = argv.indexOf('--file');
  const file = fileFlagIndex !== -1 ? argv[fileFlagIndex + 1] : DEFAULT_FILE;
  return { write, file };
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function splitCommaList(value) {
  if (!value || typeof value !== 'string') return undefined;
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

/** Builds the additive update payload for one sheet row. Omits any field that's blank in the row. */
function buildUpdatePayload(row, nowIso) {
  const payload = { master_spreadsheet_imported_at: nowIso };

  const costPrice = parseNumber(row['Your Price (Including Tariff)']);
  const mapPrice = parseNumber(row['Minimum Advertised Price']);
  const retailPrice = parseNumber(row['Retail (Including Tariff)']);
  const colorwayGroup = row['Colorway Group #'];
  const brand = row['Brand'];
  const sampleBooks = splitCommaList(row['Sample Book(s)']);
  const ecoFriendly = splitCommaList(row['Eco Friendly']);
  const constructionType = splitCommaList(row['Type']);
  const properties = splitCommaList(row['Properties']);

  if (costPrice !== undefined) payload.cost_price = costPrice;
  if (mapPrice !== undefined) payload.map_price = mapPrice;
  if (retailPrice !== undefined) payload.retail_price = retailPrice;
  if (colorwayGroup !== undefined && colorwayGroup !== null && colorwayGroup !== '') {
    payload.colorway_group = String(colorwayGroup);
  }
  if (brand) payload.brand = String(brand);
  if (sampleBooks) payload.sample_books = sampleBooks;
  if (ecoFriendly) payload.eco_friendly = ecoFriendly;
  if (constructionType) payload.construction_type = constructionType;
  if (properties) payload.properties = properties;
  payload.is_new = row['New'] === 'X';

  return payload;
}

/**
 * The `sku` column is scraped verbatim from the site's JSON-LD, which for most products is
 * "<code> <pattern name>" (e.g. "1003 Edinbourgh") rather than the bare code — only a minority of
 * newer-format products (e.g. "10000-01") have no name suffix. The spreadsheet's sku column is
 * always the bare code, so the join key is the leading whitespace-delimited token of our sku,
 * not the full string.
 */
function leadingSkuToken(sku) {
  return String(sku || '').trim().split(/\s+/)[0];
}

async function loadSkuMap(supabase) {
  const { data, error } = await supabase.from('charlotte_fabrics').select('id, sku');
  if (error) throw error;

  const skuToId = new Map();
  const duplicates = [];
  (data || []).forEach((row) => {
    const code = leadingSkuToken(row.sku);
    if (!code) return;
    if (skuToId.has(code)) {
      duplicates.push({ sku: code, ids: [skuToId.get(code), row.id] });
      return; // keep the first match, skip the rest
    }
    skuToId.set(code, row.id);
  });
  return { skuToId, duplicates };
}

async function main() {
  const { write, file } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(file)) {
    console.error(`Spreadsheet not found: ${file}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Mode: ${write ? 'WRITE (committing to Supabase)' : 'DRY RUN (no writes — pass --write to commit)'}`);
  console.log(`Reading "${SHEET_NAME}" from ${file}...`);

  const workbook = XLSX.readFile(file);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    console.error(`Sheet "${SHEET_NAME}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log(`Parsed ${rows.length} rows.\n`);

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).');
    process.exitCode = 1;
    return;
  }

  try {
    console.log('Loading existing charlotte_fabrics catalog for SKU matching...');
    const { skuToId, duplicates } = await loadSkuMap(supabase);
    console.log(`Loaded ${skuToId.size} unique SKUs from Supabase.`);
    if (duplicates.length > 0) {
      console.warn(`Warning: ${duplicates.length} duplicate SKU(s) found — only the first row per SKU was matched:`);
      duplicates.forEach((d) => console.warn(`  sku ${d.sku}: ${d.ids.join(', ')}`));
    }

    const nowIso = new Date().toISOString();
    const unmatched = [];
    const matches = []; // { sku, id, payload }
    const unmatchedByCategory = new Map();

    for (const row of rows) {
      const sku = String(row.sku ?? '').trim();
      if (!sku) continue;
      const id = skuToId.get(sku);
      if (!id) {
        const category = row['Category'] || 'Unknown';
        unmatchedByCategory.set(category, (unmatchedByCategory.get(category) || 0) + 1);
        unmatched.push({ sku, colorName: row['Color Name'] || '', category });
        continue;
      }
      matches.push({ sku, id, payload: buildUpdatePayload(row, nowIso) });
    }

    console.log(`\nMatched: ${matches.length} / ${rows.length}`);
    console.log(`Unmatched: ${unmatched.length}`);
    for (const [category, count] of unmatchedByCategory.entries()) {
      console.log(`  ${category}: ${count}`);
    }

    console.log('\nSample of planned updates:');
    matches.slice(0, 3).forEach(({ sku, id, payload }) => {
      console.log(`  sku ${sku} (id ${id}):`, JSON.stringify({ ...payload, master_spreadsheet_imported_at: undefined }));
    });

    fs.writeFileSync(REPORT_FILE, JSON.stringify(unmatched, null, 2));
    console.log(`\nUnmatched SKU report written to ${REPORT_FILE}`);

    if (!write) {
      console.log('\nDry run complete — no writes were made. Re-run with --write to commit.');
      return;
    }

    console.log(`\nCommitting ${matches.length} update(s) with concurrency ${UPDATE_CONCURRENCY}...`);
    let committed = 0;
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < matches.length) {
        const myIndex = nextIndex;
        nextIndex += 1;
        const { id, payload } = matches[myIndex];
        const { error } = await supabase.from('charlotte_fabrics').update(payload).eq('id', id);
        if (error) console.error(`Failed to update id ${id}:`, error.message);
        committed += 1;
        if (committed % 100 === 0 || committed === matches.length) {
          console.log(`  committed ${committed} / ${matches.length}`);
        }
      }
    };
    await Promise.all(Array.from({ length: UPDATE_CONCURRENCY }, () => worker()));

    console.log('\n✅ Import complete.');
  } catch (err) {
    console.error('Import failed:', err);
    process.exitCode = 1;
  }
}

main();
