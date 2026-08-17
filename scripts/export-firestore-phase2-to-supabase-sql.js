/**
 * Reads charlotteFabrics + sampleRequests from Firestore (read-only) and writes
 * chunked, reviewable SQL files matching the Postgres schema in
 * supabase/migrations/20260817120000_phase2_schema.sql. This script never
 * connects to Supabase and never writes anything except the local .sql files
 * below -- you review and run them yourself in the Supabase SQL editor (after
 * running the schema/RLS migrations), per the "I run all SQL myself" workflow.
 *
 * Reuses the exact NAMESPACE constant from scripts/export-firestore-to-supabase-sql.js
 * (Phase 1) so that charlotte_fabrics.price_tag_id and fabric_group_members
 * resolve to the fabric_price_tags/fabric_groups rows Phase 1 already inserted.
 *
 * charlotteFabricsSyncRuns is intentionally NOT exported -- it's a job-status
 * log, starts fresh in the new charlotte_fabric_sync_runs table.
 *
 * Run manually: node scripts/export-firestore-phase2-to-supabase-sql.js
 *
 * Env vars:
 *   FIREBASE_SERVICE_ACCOUNT - JSON string of the service account (used in CI).
 *                               Falls back to the local service account file used
 *                               by scripts/setup-admin-user.js when unset.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { v5: uuidv5 } = require('uuid');

// Must match scripts/export-firestore-to-supabase-sql.js exactly.
const NAMESPACE = '7d6f4b0a-6e0a-4f0a-8e0a-7a6f4b0a6e0a';

const OUTPUT_DIR = path.join(__dirname, '..', 'supabase', 'sql', 'data');
const FABRICS_CHUNK_SIZE = 300; // specs jsonb can be sizable per-row; keep each SQL-editor paste manageable

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

function uuidFor(...parts) {
  return uuidv5(parts.join('/'), NAMESPACE);
}

function sqlStr(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'NULL';
  return String(value);
}

function sqlBool(value) {
  if (value === null || value === undefined) return 'NULL';
  return value ? 'true' : 'false';
}

function sqlJsonbObject(value) {
  const json = JSON.stringify(value ?? {}).replace(/'/g, "''");
  return `'${json}'::jsonb`;
}

function sqlTextArray(values) {
  if (!values || values.length === 0) return 'ARRAY[]::text[]';
  return `ARRAY[${values.map(sqlStr).join(', ')}]::text[]`;
}

function tsToIso(value) {
  if (!value) return new Date().toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function buildUpsert(table, columns, rows, updateColumns, conflictColumns = ['id']) {
  if (rows.length === 0) return `-- ${table}: nothing to insert in this chunk.\n`;
  const values = rows.map((row) => `  (${row.join(', ')})`).join(',\n');
  const updateClause = updateColumns.map((c) => `${c} = excluded.${c}`).join(',\n    ');
  return (
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values}\n` +
    `ON CONFLICT (${conflictColumns.join(', ')}) DO UPDATE SET\n    ${updateClause};\n`
  );
}

async function fetchCollection(db, name) {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

// ---------------------------------------------------------------------------
// charlotte_fabrics
// ---------------------------------------------------------------------------
const FABRIC_COLUMNS = [
  'id', 'legacy_id', 'name', 'sku', 'product_url', 'image_url', 'image_ok',
  'color', 'pattern', 'material', 'applications', 'markets',
  'fiber_content', 'durability', 'width', 'repeat', 'pattern_direction',
  'cleanability', 'flammability', 'origin', 'features', 'performance', 'specs',
  'availability', 'status', 'first_seen_at', 'last_seen_at', 'last_checked_at',
  'price_tag_id', 'cost_price', 'map_price', 'retail_price', 'colorway_group',
  'brand', 'sample_books', 'eco_friendly', 'construction_type', 'properties',
  'is_new', 'master_spreadsheet_imported_at', 'manual_retail_price',
];
const FABRIC_UPDATE_COLUMNS = FABRIC_COLUMNS.filter((c) => c !== 'id');

function charlotteFabricRow(id, data) {
  const priceTagId = data.priceTagId ? uuidFor('fabricPriceTags', data.priceTagId) : null;
  return [
    sqlStr(uuidFor('charlotteFabrics', id)),
    sqlStr(id),
    sqlStr(data.name || ''),
    sqlStr(data.sku || ''),
    sqlStr(data.productUrl || ''),
    sqlStr(data.imageUrl || ''),
    sqlBool(data.imageOk ?? true),
    sqlTextArray(data.color || []),
    sqlTextArray(data.pattern || []),
    sqlTextArray(data.material || []),
    sqlTextArray(data.applications || []),
    sqlTextArray(data.markets || []),
    sqlStr(data.fiberContent || null),
    sqlStr(data.durability || null),
    sqlStr(data.width || null),
    sqlStr(data.repeat || null),
    sqlStr(data.patternDirection || null),
    sqlStr(data.cleanability || null),
    sqlStr(data.flammability || null),
    sqlStr(data.origin || null),
    sqlStr(data.features || null),
    sqlStr(data.performance || null),
    sqlJsonbObject(data.specs || {}),
    sqlStr(data.availability || 'InStock'),
    sqlStr(data.status || 'active'),
    sqlStr(tsToIso(data.firstSeenAt)),
    sqlStr(tsToIso(data.lastSeenAt)),
    sqlStr(tsToIso(data.lastCheckedAt)),
    sqlStr(priceTagId),
    sqlNum(data.costPrice),
    sqlNum(data.mapPrice),
    sqlNum(data.retailPrice),
    sqlStr(data.colorwayGroup || null),
    sqlStr(data.brand || null),
    sqlTextArray(data.sampleBooks || []),
    sqlTextArray(data.ecoFriendly || []),
    sqlTextArray(data.constructionType || []),
    sqlTextArray(data.properties || []),
    sqlBool(data.isNew ?? false),
    data.masterSpreadsheetImportedAt ? sqlStr(tsToIso(data.masterSpreadsheetImportedAt)) : 'NULL',
    sqlNum(data.manualRetailPrice),
  ];
}

// ---------------------------------------------------------------------------
// sample_requests / sample_request_items
// ---------------------------------------------------------------------------
const SAMPLE_REQUEST_COLUMNS = [
  'id', 'legacy_id', 'name', 'email', 'phone',
  'address_line1', 'address_line2', 'address_city', 'address_state', 'address_zip', 'address_country',
  'status', 'created_at',
];
const SAMPLE_REQUEST_UPDATE_COLUMNS = SAMPLE_REQUEST_COLUMNS.filter((c) => c !== 'id');

function sampleRequestRow(id, data) {
  const address = data.address || {};
  return [
    sqlStr(uuidFor('sampleRequests', id)),
    sqlStr(id),
    sqlStr(data.name || ''),
    sqlStr(data.email || ''),
    sqlStr(data.phone || null),
    sqlStr(address.line1 || ''),
    sqlStr(address.line2 || null),
    sqlStr(address.city || ''),
    sqlStr(address.state || ''),
    sqlStr(address.zip || ''),
    sqlStr(address.country || ''),
    sqlStr(data.status || 'pending'),
    sqlStr(tsToIso(data.createdAt)),
  ];
}

async function main() {
  initFirebase();
  const db = admin.firestore();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // -------------------------------------------------------------------------
  // charlotte_fabrics -- chunked
  // -------------------------------------------------------------------------
  console.log('Reading charlotteFabrics...');
  const fabrics = await fetchCollection(db, 'charlotteFabrics');
  console.log(`Fetched ${fabrics.length} charlotteFabrics documents.`);

  const fabricChunks = [];
  for (let i = 0; i < fabrics.length; i += FABRICS_CHUNK_SIZE) {
    fabricChunks.push(fabrics.slice(i, i + FABRICS_CHUNK_SIZE));
  }

  const fabricFiles = [];
  fabricChunks.forEach((chunkDocs, index) => {
    const fileNumber = String(index + 1).padStart(3, '0');
    const fileName = `phase2_charlotte_fabrics_${fileNumber}.generated.sql`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const rows = chunkDocs.map(({ id, data }) => charlotteFabricRow(id, data));
    const body =
      `-- Generated by scripts/export-firestore-phase2-to-supabase-sql.js\n` +
      `-- Chunk ${index + 1} of ${fabricChunks.length} (${rows.length} rows)\n` +
      `-- Run AFTER the phase2 schema + RLS migrations, and run chunks in order.\n\n` +
      `BEGIN;\n\n` +
      buildUpsert('charlotte_fabrics', FABRIC_COLUMNS, rows, FABRIC_UPDATE_COLUMNS) +
      `\nCOMMIT;\n`;
    fs.writeFileSync(filePath, body, 'utf8');
    fabricFiles.push(fileName);
  });

  // -------------------------------------------------------------------------
  // fabric_group_members -- run AFTER all charlotte_fabrics chunks (FK dependency)
  // -------------------------------------------------------------------------
  const groupMemberRows = [];
  fabrics.forEach(({ id, data }) => {
    (data.groupIds || []).forEach((groupId) => {
      groupMemberRows.push(`  (${sqlStr(uuidFor('charlotteFabrics', id))}, ${sqlStr(uuidFor('fabricGroups', groupId))})`);
    });
  });
  const groupMembersFileName = 'phase2_fabric_group_members.generated.sql';
  const groupMembersBody =
    `-- Generated by scripts/export-firestore-phase2-to-supabase-sql.js\n` +
    `-- Run AFTER every phase2_charlotte_fabrics_*.generated.sql chunk has been run.\n\n` +
    `BEGIN;\n\n` +
    (groupMemberRows.length > 0
      ? `INSERT INTO fabric_group_members (fabric_id, group_id) VALUES\n${groupMemberRows.join(',\n')}\n` +
        `ON CONFLICT (fabric_id, group_id) DO NOTHING;\n`
      : `-- No fabric_group_members to insert.\n`) +
    `\nCOMMIT;\n`;
  fs.writeFileSync(path.join(OUTPUT_DIR, groupMembersFileName), groupMembersBody, 'utf8');

  // -------------------------------------------------------------------------
  // sample_requests / sample_request_items -- small collection, one file
  // -------------------------------------------------------------------------
  console.log('Reading sampleRequests...');
  const sampleRequests = await fetchCollection(db, 'sampleRequests');
  console.log(`Fetched ${sampleRequests.length} sampleRequests documents.`);

  const sampleRequestRows = sampleRequests.map(({ id, data }) => sampleRequestRow(id, data));
  const itemBlocks = [];
  sampleRequests.forEach(({ id, data }) => {
    const requestId = uuidFor('sampleRequests', id);
    const items = data.items || [];
    itemBlocks.push(`DELETE FROM sample_request_items WHERE sample_request_id = ${sqlStr(requestId)};`);
    if (items.length > 0) {
      const rows = items.map((item, index) => {
        const fabricId = item.fabricId ? uuidFor('charlotteFabrics', item.fabricId) : null;
        return `  (${sqlStr(requestId)}, ${sqlStr(fabricId)}, ${sqlStr(item.name || '')}, ${sqlStr(item.sku || '')}, ${sqlStr(item.imageUrl || '')}, ${sqlNum(index)})`;
      });
      itemBlocks.push(
        `INSERT INTO sample_request_items (sample_request_id, fabric_id, name, sku, image_url, sort_order) VALUES\n${rows.join(',\n')};`
      );
    }
  });

  const sampleRequestsFileName = 'phase2_sample_requests.generated.sql';
  const sampleRequestsBody =
    `-- Generated by scripts/export-firestore-phase2-to-supabase-sql.js\n` +
    `-- Run any time after the phase2 schema + RLS migrations (no FK dependency on the\n` +
    `-- charlotte_fabrics chunks -- sample_request_items.fabric_id is a nullable soft FK).\n\n` +
    `BEGIN;\n\n` +
    buildUpsert('sample_requests', SAMPLE_REQUEST_COLUMNS, sampleRequestRows, SAMPLE_REQUEST_UPDATE_COLUMNS) +
    (itemBlocks.length > 0 ? `\n-- sample_request_items (replaced wholesale per parent)\n${itemBlocks.join('\n')}\n` : '') +
    `\nCOMMIT;\n`;
  fs.writeFileSync(path.join(OUTPUT_DIR, sampleRequestsFileName), sampleRequestsBody, 'utf8');

  // -------------------------------------------------------------------------
  // summary
  // -------------------------------------------------------------------------
  console.log('\nWrote:');
  fabricFiles.forEach((f) => console.log(`  ${path.join('supabase', 'sql', 'data', f)}`));
  console.log(`  ${path.join('supabase', 'sql', 'data', groupMembersFileName)} (${groupMemberRows.length} membership rows)`);
  console.log(`  ${path.join('supabase', 'sql', 'data', sampleRequestsFileName)} (${sampleRequests.length} sample requests)`);
  console.log('\nRun order: charlotte_fabrics chunks (in numeric order) -> fabric_group_members -> sample_requests (any time).');
}

main().catch((error) => {
  console.error('Export failed:', error);
  process.exitCode = 1;
});
