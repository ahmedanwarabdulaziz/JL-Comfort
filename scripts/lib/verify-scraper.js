/**
 * Offline sanity check for charlotteFabricsScraper.js — runs the parser against real HTML
 * saved from the live site (no network access), so a parsing regression is caught instantly
 * instead of only surfacing mid-crawl.
 *
 * Run: node scripts/lib/verify-scraper.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const {
  extractProductLinks,
  validateListingPage,
  parseJsonLd,
  parseSpecTable,
  validateProductPage,
} = require('./charlotteFabricsScraper');

const FIXTURES_DIR = path.join(__dirname, '__fixtures__');
const listingHtml = fs.readFileSync(path.join(FIXTURES_DIR, 'listing-sample.html'), 'utf8');
const productHtml = fs.readFileSync(path.join(FIXTURES_DIR, 'product-sample.html'), 'utf8');
const junkHtml = '<html><body><h1>Totally unrelated page</h1><p>Nothing here matches.</p></body></html>';

let passed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('Listing page parsing:');
check('extractProductLinks finds products', () => {
  const links = extractProductLinks(listingHtml);
  assert.ok(links.length > 0, 'expected at least one product link');
  assert.ok(
    links.every((l) => l.startsWith('https://www.charlottefabrics.com/shop/')),
    'all links should be product URLs'
  );
  assert.strictEqual(links.length, new Set(links).size, 'links should be deduplicated');
});
check('validateListingPage accepts a real listing page', () => {
  assert.strictEqual(validateListingPage(listingHtml), true);
});
check('validateListingPage rejects an unrelated page', () => {
  assert.strictEqual(validateListingPage(junkHtml), false);
});

console.log('Product page parsing:');
check('parseJsonLd extracts product identity', () => {
  const jsonLd = parseJsonLd(productHtml);
  assert.ok(jsonLd, 'expected JSON-LD to be found');
  assert.ok(jsonLd.name, 'expected a name');
  assert.ok(jsonLd.sku, 'expected a sku');
  assert.ok(jsonLd.imageUrl.startsWith('https://www.charlottefabrics.com/'), 'expected a full-res image URL');
  assert.ok(jsonLd.availability === 'InStock' || jsonLd.availability === 'OutOfStock');
});
check('parseSpecTable captures Inventory (no right-side-specs class on this row)', () => {
  const specs = parseSpecTable(productHtml);
  assert.ok(specs.Inventory, 'expected an Inventory value — this is the bug the cheerio rewrite fixes');
  assert.ok(specs.Durability, 'expected a Durability value');
});
check('validateProductPage accepts a real product page', () => {
  assert.strictEqual(validateProductPage(productHtml), true);
});
check('validateProductPage rejects an unrelated page', () => {
  assert.strictEqual(validateProductPage(junkHtml), false);
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error('Some checks FAILED — see above.');
} else {
  console.log('All checks passed.');
}
