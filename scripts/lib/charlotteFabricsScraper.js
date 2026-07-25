/**
 * Hardened parsing/fetching for charlottefabrics.com — real DOM parsing (cheerio) instead
 * of regex, retries with backoff, and loud validation instead of silent empty results.
 *
 * Selectors verified against live pages:
 *   - Listing: each product is `<a href="…/shop/slug/" class="product-images" aria-label="Name">`.
 *   - Product spec table: `<table class="spec-table"><tr><td>Label</td><td>Value…</td></tr>…`.
 *     The value <td> does NOT always carry a "right-side-specs" class (e.g. the Inventory row
 *     doesn't) — so we take the first two <td> in each row by position, not by class.
 */

const cheerio = require('cheerio');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const RETRY_DELAYS_MS = [500, 1500, 4000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetches a URL as text, retrying on network errors, 5xx, and 429. Returns null if all attempts fail. */
async function fetchWithRetry(url, options = {}) {
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cache-Control': 'no-cache',
    ...options.headers,
  };

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.ok) {
        return options.method === 'HEAD' ? '' : await res.text();
      }
      const retryable = res.status >= 500 || res.status === 429;
      if (!retryable || attempt === RETRY_DELAYS_MS.length) {
        return null;
      }
    } catch {
      if (attempt === RETRY_DELAYS_MS.length) return null;
    }
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
  return null;
}

/** HEAD-checks an image URL, retrying on network errors/5xx/429. */
async function checkImageOk(imageUrl) {
  if (!imageUrl) return false;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const res = await fetch(imageUrl, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT } });
      if (res.ok) return true;
      const retryable = res.status >= 500 || res.status === 429;
      if (!retryable) return false;
    } catch {
      // fall through to retry
    }
    if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
  }
  return false;
}

/** Extracts unique product URLs from a listing page. */
function extractProductLinks(html) {
  const $ = cheerio.load(html);
  const links = new Set();
  $('a.product-images[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) links.add(href);
  });
  return Array.from(links);
}

/**
 * A listing page is structurally valid if it either has product links, or shows a
 * recognizable "no products found" state. Anything else (200 response, but neither)
 * suggests the site's layout changed and our selectors no longer match.
 */
function validateListingPage(html) {
  const $ = cheerio.load(html);
  const hasProducts = $('a.product-images[href]').length > 0;
  const hasEmptyState = /no products were found|nothing found/i.test($('body').text());
  return hasProducts || hasEmptyState;
}

/** Parses the schema.org Product JSON-LD block for name/sku/image/availability. */
function parseJsonLd(html) {
  const $ = cheerio.load(html);
  let result = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    if (result) return;
    try {
      const data = JSON.parse($(el).contents().text());
      const nodes = data['@graph'] || [data];
      const product = nodes.find((n) => n['@type'] === 'Product');
      if (product) {
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        const availability = offer?.availability || '';
        result = {
          name: product.name || '',
          sku: product.sku || '',
          imageUrl: product.image || '',
          availability: availability.includes('OutOfStock') ? 'OutOfStock' : 'InStock',
        };
      }
    } catch {
      // malformed block, try the next one
    }
  });

  return result;
}

/** Parses the product page's "Product Specs" table into a label -> value map. */
function parseSpecTable(html) {
  const $ = cheerio.load(html);
  const specs = {};

  $('table.spec-table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;
    const label = $(cells[0]).text().trim();
    const value = $(cells[1]).text().trim();
    if (label && value) specs[label] = value;
  });

  return specs;
}

/**
 * A product page is structurally valid if it has either JSON-LD Product data or a spec
 * table. Neither present (on a 200 response) suggests the layout changed.
 */
function validateProductPage(html) {
  const $ = cheerio.load(html);
  const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
  const hasSpecTable = $('table.spec-table tr').length > 0;
  return hasJsonLd || hasSpecTable;
}

module.exports = {
  fetchWithRetry,
  checkImageOk,
  extractProductLinks,
  validateListingPage,
  parseJsonLd,
  parseSpecTable,
  validateProductPage,
};
