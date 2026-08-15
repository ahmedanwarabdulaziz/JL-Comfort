/**
 * Merges the "Current Patterns" tab of the Charlotte Fabrics master spreadsheet into the
 * `charlotteFabrics` Firestore collection, matched by SKU. Adds fields the website scraper can't
 * get (real cost/MAP/retail pricing, colorway group, brand, sample book, eco certs, construction
 * type, properties, new-item flag) onto existing docs — never overwrites or blanks anything.
 *
 * A SKU with no matching Firestore doc (e.g. Vinyl-category rows, since Vinyl isn't crawled today)
 * is skipped entirely and reported, not written. A Firestore doc whose SKU has no row in the sheet
 * is left completely untouched.
 *
 * Run (dry-run, default):  node scripts/import-charlotte-master-spreadsheet.js
 * Run (commits writes):    node scripts/import-charlotte-master-spreadsheet.js --write
 * Custom file path:        node scripts/import-charlotte-master-spreadsheet.js --file path/to.xlsx
 *
 * Env vars:
 *   FIREBASE_SERVICE_ACCOUNT - JSON string of the service account. Falls back to the local
 *                               service account file used by scripts/setup-admin-user.js when unset.
 */

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const admin = require('firebase-admin');

const SHEET_NAME = 'Current Patterns';
const DEFAULT_FILE = path.join(__dirname, '../data/charlotte-fabrics/master-spreadsheet.xlsx');
const REPORT_FILE = path.join(__dirname, '../data/charlotte-fabrics/unmatched-skus.json');
const BATCH_CHUNK_SIZE = 400;

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
function buildUpdatePayload(row, now) {
  const payload = { masterSpreadsheetImportedAt: now };

  const costPrice = parseNumber(row['Your Price (Including Tariff)']);
  const mapPrice = parseNumber(row['Minimum Advertised Price']);
  const retailPrice = parseNumber(row['Retail (Including Tariff)']);
  const colorwayGroup = row['Colorway Group #'];
  const brand = row['Brand'];
  const sampleBooks = splitCommaList(row['Sample Book(s)']);
  const ecoFriendly = splitCommaList(row['Eco Friendly']);
  const constructionType = splitCommaList(row['Type']);
  const properties = splitCommaList(row['Properties']);

  if (costPrice !== undefined) payload.costPrice = costPrice;
  if (mapPrice !== undefined) payload.mapPrice = mapPrice;
  if (retailPrice !== undefined) payload.retailPrice = retailPrice;
  if (colorwayGroup !== undefined && colorwayGroup !== null && colorwayGroup !== '') {
    payload.colorwayGroup = String(colorwayGroup);
  }
  if (brand) payload.brand = String(brand);
  if (sampleBooks) payload.sampleBooks = sampleBooks;
  if (ecoFriendly) payload.ecoFriendly = ecoFriendly;
  if (constructionType) payload.constructionType = constructionType;
  if (properties) payload.properties = properties;
  payload.isNew = row['New'] === 'X';

  return payload;
}

/**
 * Firestore's `sku` field is scraped verbatim from the site's JSON-LD, which for most products is
 * "<code> <pattern name>" (e.g. "1003 Edinbourgh") rather than the bare code — only a minority of
 * newer-format products (e.g. "10000-01") have no name suffix. The spreadsheet's sku column is
 * always the bare code, so the join key is the leading whitespace-delimited token of Firestore's
 * sku, not the full string.
 */
function leadingSkuToken(sku) {
  return String(sku || '').trim().split(/\s+/)[0];
}

async function loadSkuMap(db) {
  const snapshot = await db.collection('charlotteFabrics').get();
  const skuToDocId = new Map();
  const duplicates = [];
  snapshot.docs.forEach((doc) => {
    const code = leadingSkuToken(doc.data().sku);
    if (!code) return;
    if (skuToDocId.has(code)) {
      duplicates.push({ sku: code, docIds: [skuToDocId.get(code), doc.id] });
      return; // keep the first match, skip the rest
    }
    skuToDocId.set(code, doc.id);
  });
  return { skuToDocId, duplicates };
}

async function main() {
  const { write, file } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(file)) {
    console.error(`Spreadsheet not found: ${file}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Mode: ${write ? 'WRITE (committing to Firestore)' : 'DRY RUN (no writes — pass --write to commit)'}`);
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

  initFirebase();
  const db = admin.firestore();

  try {
    console.log('Loading existing charlotteFabrics catalog for SKU matching...');
    const { skuToDocId, duplicates } = await loadSkuMap(db);
    console.log(`Loaded ${skuToDocId.size} unique SKUs from Firestore.`);
    if (duplicates.length > 0) {
      console.warn(`Warning: ${duplicates.length} duplicate SKU(s) found in Firestore — only the first doc per SKU was matched:`);
      duplicates.forEach((d) => console.warn(`  sku ${d.sku}: ${d.docIds.join(', ')}`));
    }

    const now = admin.firestore.Timestamp.fromDate(new Date());
    const unmatched = [];
    const matches = []; // { sku, docId, payload }
    const unmatchedByCategory = new Map();

    for (const row of rows) {
      const sku = String(row.sku ?? '').trim();
      if (!sku) continue;
      const docId = skuToDocId.get(sku);
      if (!docId) {
        const category = row['Category'] || 'Unknown';
        unmatchedByCategory.set(category, (unmatchedByCategory.get(category) || 0) + 1);
        unmatched.push({ sku, colorName: row['Color Name'] || '', category });
        continue;
      }
      matches.push({ sku, docId, payload: buildUpdatePayload(row, now) });
    }

    console.log(`\nMatched: ${matches.length} / ${rows.length}`);
    console.log(`Unmatched: ${unmatched.length}`);
    for (const [category, count] of unmatchedByCategory.entries()) {
      console.log(`  ${category}: ${count}`);
    }

    console.log('\nSample of planned updates:');
    matches.slice(0, 3).forEach(({ sku, docId, payload }) => {
      console.log(`  sku ${sku} (doc ${docId}):`, JSON.stringify({ ...payload, masterSpreadsheetImportedAt: undefined }));
    });

    fs.writeFileSync(REPORT_FILE, JSON.stringify(unmatched, null, 2));
    console.log(`\nUnmatched SKU report written to ${REPORT_FILE}`);

    if (!write) {
      console.log('\nDry run complete — no Firestore writes were made. Re-run with --write to commit.');
      return;
    }

    console.log(`\nCommitting ${matches.length} update(s) in batches of ${BATCH_CHUNK_SIZE}...`);
    let committed = 0;
    for (let i = 0; i < matches.length; i += BATCH_CHUNK_SIZE) {
      const chunk = matches.slice(i, i + BATCH_CHUNK_SIZE);
      const batch = db.batch();
      chunk.forEach(({ docId, payload }) => {
        batch.update(db.collection('charlotteFabrics').doc(docId), payload);
      });
      await batch.commit();
      committed += chunk.length;
      console.log(`  committed ${committed} / ${matches.length}`);
    }

    console.log('\n✅ Import complete.');
  } catch (err) {
    console.error('Import failed:', err);
    process.exitCode = 1;
  } finally {
    await admin.app().delete();
  }
}

main();
