/**
 * Reads the 11 Phase-1 config/lookup collections from Firestore (read-only)
 * and writes a single reviewable SQL file with INSERT statements matching
 * the Postgres schema in supabase/migrations/. This script never connects
 * to Supabase and never writes anything except the local .sql file below --
 * you review and run the generated file yourself in the Supabase SQL editor
 * (after running the schema/RLS migrations), per the "I run all SQL myself"
 * migration workflow.
 *
 * Safe to rerun: ids are derived deterministically from each Firestore
 * document's collection + doc id, so regenerating and re-running produces
 * the same rows (upsert via ON CONFLICT), even while the admin keeps
 * editing data in Firestore during the transition window.
 *
 * Run manually: node scripts/export-firestore-to-supabase-sql.js
 *
 * Env vars:
 *   FIREBASE_SERVICE_ACCOUNT - JSON string of the service account (used in CI).
 *                               Falls back to the local service account file used
 *                               by scripts/setup-admin-user.js when unset.
 *
 * Out of scope (Phase 2, not touched by this script): charlotteFabrics,
 * charlotteFabricsSyncRuns, sampleRequests.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { v5: uuidv5 } = require('uuid');

// Fixed, arbitrary namespace UUID. Do not change -- every generated id is
// derived from it, and changing it would shift every id on the next rerun.
const NAMESPACE = '7d6f4b0a-6e0a-4f0a-8e0a-7a6f4b0a6e0a';

const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'sql',
  'data',
  'phase1_data_insert.generated.sql'
);

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

function sqlJsonb(value) {
  const json = JSON.stringify(value ?? []).replace(/'/g, "''");
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

function buildUpsert(table, columns, rows, updateColumns) {
  if (rows.length === 0) return `-- ${table}: no documents found in Firestore, nothing to insert.\n`;
  const values = rows.map((row) => `  (${row.join(', ')})`).join(',\n');
  const updateClause = updateColumns.map((c) => `${c} = excluded.${c}`).join(',\n    ');
  return (
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values}\n` +
    `ON CONFLICT (id) DO UPDATE SET\n    ${updateClause};\n`
  );
}

async function fetchCollection(db, name) {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

async function main() {
  initFirebase();
  const db = admin.firestore();
  const sections = [];
  const summary = [];

  // ---------------------------------------------------------------------
  // categories
  // ---------------------------------------------------------------------
  const categories = await fetchCollection(db, 'categories');
  const categoryIdFor = (legacyId) => uuidFor('categories', legacyId);
  sections.push(
    '-- categories\n' +
      buildUpsert(
        'categories',
        ['id', 'legacy_id', 'name', 'description', 'sort_order', 'created_at', 'updated_at'],
        categories.map(({ id, data }) => [
          sqlStr(categoryIdFor(id)),
          sqlStr(id),
          sqlStr(data.name || ''),
          sqlStr(data.description || ''),
          sqlNum(data.sortOrder ?? 0),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        ['legacy_id', 'name', 'description', 'sort_order', 'updated_at']
      )
  );
  summary.push(['categories', categories.length]);

  // ---------------------------------------------------------------------
  // foam (category_id FK resolved via the same deterministic id scheme --
  // no lookup pass needed, and it's fine if the referenced category hasn't
  // been inserted by a prior statement, since foam is emitted after
  // categories in this same transaction)
  // ---------------------------------------------------------------------
  const foam = await fetchCollection(db, 'foam');
  sections.push(
    '-- foam\n' +
      buildUpsert(
        'foam',
        [
          'id',
          'legacy_id',
          'category_id',
          'name',
          'description',
          'image_url',
          'svg_id',
          'custom_svg_content',
          'dimensions',
          'sort_order',
          'created_at',
          'updated_at',
        ],
        foam.map(({ id, data }) => {
          const dimensions = (data.dimensions || []).map((dim) => ({
            ...dim,
            type: dim.type === 'length' ? 'depth' : dim.type,
          }));
          return [
            sqlStr(uuidFor('foam', id)),
            sqlStr(id),
            sqlStr(categoryIdFor(data.categoryId || '')),
            sqlStr(data.name || ''),
            sqlStr(data.description || ''),
            sqlStr(data.imageUrl || null),
            sqlStr(data.svgId || null),
            sqlStr(data.customSvgContent || null),
            sqlJsonb(dimensions),
            sqlNum(data.sortOrder ?? 0),
            sqlStr(tsToIso(data.createdAt)),
            sqlStr(tsToIso(data.updatedAt)),
          ];
        }),
        [
          'legacy_id',
          'category_id',
          'name',
          'description',
          'image_url',
          'svg_id',
          'custom_svg_content',
          'dimensions',
          'sort_order',
          'updated_at',
        ]
      )
  );
  summary.push(['foam', foam.length]);

  // ---------------------------------------------------------------------
  // foam_grades
  // ---------------------------------------------------------------------
  const foamGrades = await fetchCollection(db, 'foamGrades');
  sections.push(
    '-- foam_grades\n' +
      buildUpsert(
        'foam_grades',
        ['id', 'legacy_id', 'brand', 'grade_name', 'price', 'density', 'firmness', 'warranty', 'created_at', 'updated_at'],
        foamGrades.map(({ id, data }) => [
          sqlStr(uuidFor('foamGrades', id)),
          sqlStr(id),
          sqlStr(data.brand || ''),
          sqlStr(data.gradeName || ''),
          sqlNum(data.price ?? 0),
          sqlStr(data.density || null),
          sqlStr(data.firmness || null),
          sqlStr(data.warranty || null),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        ['legacy_id', 'brand', 'grade_name', 'price', 'density', 'firmness', 'warranty', 'updated_at']
      )
  );
  summary.push(['foam_grades', foamGrades.length]);

  // ---------------------------------------------------------------------
  // dimension_rules
  // ---------------------------------------------------------------------
  const dimensionRules = await fetchCollection(db, 'dimensionRules');
  sections.push(
    '-- dimension_rules\n' +
      buildUpsert(
        'dimension_rules',
        [
          'id',
          'legacy_id',
          'dimension_type',
          'allow_fractions',
          'min_value',
          'max_value',
          'max_block_length',
          'ranges',
          'created_at',
          'updated_at',
        ],
        dimensionRules.map(({ id, data }) => [
          sqlStr(uuidFor('dimensionRules', id)),
          sqlStr(id),
          sqlStr(data.dimensionType || 'width'),
          sqlBool(data.allowFractions ?? true),
          sqlNum(data.minValue),
          sqlNum(data.maxValue),
          sqlNum(data.maxBlockLength),
          sqlJsonb(data.ranges || []),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        [
          'legacy_id',
          'dimension_type',
          'allow_fractions',
          'min_value',
          'max_value',
          'max_block_length',
          'ranges',
          'updated_at',
        ]
      )
  );
  summary.push(['dimension_rules', dimensionRules.length]);

  // ---------------------------------------------------------------------
  // fibre_wrap
  // ---------------------------------------------------------------------
  const fibreWrap = await fetchCollection(db, 'fibreWrap');
  sections.push(
    '-- fibre_wrap\n' +
      buildUpsert(
        'fibre_wrap',
        ['id', 'legacy_id', 'fibre_thickness', 'value', 'created_at', 'updated_at'],
        fibreWrap.map(({ id, data }) => [
          sqlStr(uuidFor('fibreWrap', id)),
          sqlStr(id),
          sqlStr(data.fibreThickness || ''),
          sqlNum(data.value ?? 0),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        ['legacy_id', 'fibre_thickness', 'value', 'updated_at']
      )
  );
  summary.push(['fibre_wrap', fibreWrap.length]);

  // ---------------------------------------------------------------------
  // bench_cushions (+ variables + options, child tables replaced wholesale
  // per parent since Firestore's "identity" for array elements is only
  // their position)
  // ---------------------------------------------------------------------
  const benchCushions = await fetchCollection(db, 'benchCushions');
  sections.push(
    '-- bench_cushions\n' +
      buildUpsert(
        'bench_cushions',
        [
          'id',
          'legacy_id',
          'name',
          'description',
          'images',
          'dimensions',
          'base_price',
          'currency',
          'estimated_yards',
          'sort_order',
          'created_at',
          'updated_at',
        ],
        benchCushions.map(({ id, data }) => [
          sqlStr(uuidFor('benchCushions', id)),
          sqlStr(id),
          sqlStr(data.name || ''),
          sqlStr(data.description || ''),
          sqlTextArray(data.images || []),
          sqlJsonb(data.dimensions || []),
          sqlNum(data.basePrice ?? 0),
          sqlStr(data.currency || 'usd'),
          sqlNum(data.estimatedYards ?? 0),
          sqlNum(data.sortOrder ?? 0),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        [
          'legacy_id',
          'name',
          'description',
          'images',
          'dimensions',
          'base_price',
          'currency',
          'estimated_yards',
          'sort_order',
          'updated_at',
        ]
      )
  );
  summary.push(['bench_cushions', benchCushions.length]);

  const benchCushionChildBlocks = [];
  for (const { id, data } of benchCushions) {
    const cushionId = uuidFor('benchCushions', id);
    const variables = data.variables || [];
    benchCushionChildBlocks.push(`DELETE FROM bench_cushion_variables WHERE bench_cushion_id = ${sqlStr(cushionId)}; -- cascades to options`);

    if (variables.length > 0) {
      const variableRows = variables.map((v, vi) => {
        const variableId = uuidFor('benchCushions', id, 'variables', String(vi));
        return `  (${sqlStr(variableId)}, ${sqlStr(cushionId)}, ${sqlStr(v.name || '')}, ${sqlNum(vi)})`;
      });
      benchCushionChildBlocks.push(
        `INSERT INTO bench_cushion_variables (id, bench_cushion_id, name, sort_order) VALUES\n${variableRows.join(',\n')};`
      );

      const optionRows = [];
      variables.forEach((v, vi) => {
        const variableId = uuidFor('benchCushions', id, 'variables', String(vi));
        (v.options || []).forEach((o, oi) => {
          const optionId = uuidFor('benchCushions', id, 'variables', String(vi), 'options', String(oi));
          optionRows.push(
            `  (${sqlStr(optionId)}, ${sqlStr(variableId)}, ${sqlStr(o.label || '')}, ${sqlNum(o.priceModifier ?? 0)}, ${sqlStr(o.imageUrl || null)}, ${sqlNum(oi)})`
          );
        });
      });
      if (optionRows.length > 0) {
        benchCushionChildBlocks.push(
          `INSERT INTO bench_cushion_variable_options (id, variable_id, label, price_modifier, image_url, sort_order) VALUES\n${optionRows.join(',\n')};`
        );
      }
    }
  }
  if (benchCushionChildBlocks.length > 0) {
    sections.push('-- bench_cushions: variables + options (replaced wholesale per parent)\n' + benchCushionChildBlocks.join('\n') + '\n');
  }

  // ---------------------------------------------------------------------
  // fabric_price_tags
  // ---------------------------------------------------------------------
  const fabricPriceTags = await fetchCollection(db, 'fabricPriceTags');
  sections.push(
    '-- fabric_price_tags\n' +
      buildUpsert(
        'fabric_price_tags',
        ['id', 'legacy_id', 'name', 'price_per_yard', 'sort_order', 'created_at', 'updated_at'],
        fabricPriceTags.map(({ id, data }) => [
          sqlStr(uuidFor('fabricPriceTags', id)),
          sqlStr(id),
          sqlStr(data.name || ''),
          sqlNum(data.pricePerYard ?? 0),
          sqlNum(data.sortOrder ?? 0),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        ['legacy_id', 'name', 'price_per_yard', 'sort_order', 'updated_at']
      )
  );
  summary.push(['fabric_price_tags', fabricPriceTags.length]);

  // ---------------------------------------------------------------------
  // fabric_groups
  // ---------------------------------------------------------------------
  const fabricGroups = await fetchCollection(db, 'fabricGroups');
  sections.push(
    '-- fabric_groups\n' +
      buildUpsert(
        'fabric_groups',
        ['id', 'legacy_id', 'name', 'description', 'sort_order', 'created_at', 'updated_at'],
        fabricGroups.map(({ id, data }) => [
          sqlStr(uuidFor('fabricGroups', id)),
          sqlStr(id),
          sqlStr(data.name || ''),
          sqlStr(data.description || ''),
          sqlNum(data.sortOrder ?? 0),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        ['legacy_id', 'name', 'description', 'sort_order', 'updated_at']
      )
  );
  summary.push(['fabric_groups', fabricGroups.length]);

  // ---------------------------------------------------------------------
  // fabric_price_ranges
  // ---------------------------------------------------------------------
  const fabricPriceRanges = await fetchCollection(db, 'fabricPriceRanges');
  sections.push(
    '-- fabric_price_ranges\n' +
      buildUpsert(
        'fabric_price_ranges',
        ['id', 'legacy_id', 'name', 'min_price', 'max_price', 'sort_order', 'created_at', 'updated_at'],
        fabricPriceRanges.map(({ id, data }) => [
          sqlStr(uuidFor('fabricPriceRanges', id)),
          sqlStr(id),
          sqlStr(data.name || ''),
          sqlNum(data.minPrice ?? 0),
          sqlNum(data.maxPrice),
          sqlNum(data.sortOrder ?? 0),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        ['legacy_id', 'name', 'min_price', 'max_price', 'sort_order', 'updated_at']
      )
  );
  summary.push(['fabric_price_ranges', fabricPriceRanges.length]);

  // ---------------------------------------------------------------------
  // fabric_price_tiers (+ materials child table)
  // ---------------------------------------------------------------------
  const fabricPriceTiers = await fetchCollection(db, 'fabricPriceTiers');
  sections.push(
    '-- fabric_price_tiers\n' +
      buildUpsert(
        'fabric_price_tiers',
        ['id', 'legacy_id', 'name', 'price_per_yard', 'is_default', 'sort_order', 'created_at', 'updated_at'],
        fabricPriceTiers.map(({ id, data }) => [
          sqlStr(uuidFor('fabricPriceTiers', id)),
          sqlStr(id),
          sqlStr(data.name || ''),
          sqlNum(data.pricePerYard ?? 0),
          sqlBool(data.isDefault ?? false),
          sqlNum(data.sortOrder ?? 0),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        ['legacy_id', 'name', 'price_per_yard', 'is_default', 'sort_order', 'updated_at']
      )
  );
  summary.push(['fabric_price_tiers', fabricPriceTiers.length]);

  const tierMaterialBlocks = [];
  for (const { id, data } of fabricPriceTiers) {
    const tierId = uuidFor('fabricPriceTiers', id);
    const materials = data.materials || [];
    tierMaterialBlocks.push(`DELETE FROM fabric_price_tier_materials WHERE tier_id = ${sqlStr(tierId)};`);
    if (materials.length > 0) {
      const rows = materials.map((slug) => `  (${sqlStr(tierId)}, ${sqlStr(slug)})`);
      tierMaterialBlocks.push(`INSERT INTO fabric_price_tier_materials (tier_id, material_slug) VALUES\n${rows.join(',\n')};`);
    }
  }
  if (tierMaterialBlocks.length > 0) {
    sections.push('-- fabric_price_tiers: materials (replaced wholesale per parent)\n' + tierMaterialBlocks.join('\n') + '\n');
  }

  // ---------------------------------------------------------------------
  // products
  // ---------------------------------------------------------------------
  const products = await fetchCollection(db, 'products');
  sections.push(
    '-- products\n' +
      buildUpsert(
        'products',
        ['id', 'legacy_id', 'name', 'description', 'price', 'currency', 'status', 'image_url', 'created_at', 'updated_at'],
        products.map(({ id, data }) => [
          sqlStr(uuidFor('products', id)),
          sqlStr(id),
          sqlStr(data.name || ''),
          sqlStr(data.description || ''),
          sqlNum(data.price ?? 0),
          sqlStr(data.currency || 'EGP'),
          sqlStr(data.status || 'draft'),
          sqlStr(data.imageUrl || null),
          sqlStr(tsToIso(data.createdAt)),
          sqlStr(tsToIso(data.updatedAt)),
        ]),
        ['legacy_id', 'name', 'description', 'price', 'currency', 'status', 'image_url', 'updated_at']
      )
  );
  summary.push(['products', products.length]);

  // ---------------------------------------------------------------------
  // write output
  // ---------------------------------------------------------------------
  const header = [
    '-- Generated by scripts/export-firestore-to-supabase-sql.js',
    `-- Generated at: ${new Date().toISOString()}`,
    '-- Review before running. Run AFTER the schema + RLS migrations, in the Supabase SQL editor or `supabase db push`.',
    '',
    'BEGIN;',
    '',
  ].join('\n');

  const footer = '\nCOMMIT;\n';

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, header + sections.join('\n') + footer, 'utf8');

  console.log('Wrote', OUTPUT_PATH);
  console.log('\nRow counts:');
  for (const [name, count] of summary) {
    console.log(`  ${name}: ${count}`);
  }
}

main().catch((error) => {
  console.error('Export failed:', error);
  process.exitCode = 1;
});
