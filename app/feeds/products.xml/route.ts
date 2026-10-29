import { createClient } from '@supabase/supabase-js';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import { getFabricPriceTags } from '@/lib/data/fabricPriceTags';
import { describeFabric, fabricBrand, prettyFacet, searchFabricName } from '@/lib/seo/fabric';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { fabricKeywords } from '@/lib/collections/definitions';
import { getShippingRate } from '@/lib/data/shippingRates';
import { isVinylFabric } from '@/lib/checkout/serverPricing';
import type { ShippingRate } from '@/lib/types/checkout';

// Product feed for Google Merchant Center (free listings in Google Shopping + Shopping / Performance
// Max ads) and the Meta Commerce catalog (Instagram & Facebook shop and dynamic product ads).
// Both read this same Google-format RSS file. Register the URL in each as a scheduled daily fetch:
//   https://<your domain>/feeds/products.xml
// Each product's id matches the id the Google and Meta pixels report (SKU), so ads, remarketing
// and conversions line up with the catalog.
// Rendered per request (the price-tag lookup is uncached); the CDN caches it for an hour via Cache-Control below.
export const dynamic = 'force-dynamic';

const GOOGLE_CATEGORY = 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Textiles > Fabric';

const xml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

interface FabricRow {
  legacy_id: string;
  name: string | null;
  sku: string | null;
  image_url: string | null;
  fiber_content: string | null;
  durability: string | null;
  width: string | null;
  color: string[] | null;
  material: string[] | null;
  pattern: string[] | null;
  construction_type: string[] | null;
  availability: string | null;
  manual_retail_price: number | null;
  retail_price: number | null;
  price_tag_id: string | null;
}

// Custom labels group products for Shopping / Performance Max bidding and reports (Google Ads >
// product groups / listing groups). Keep the values stable: renaming one splits its history.
//   0 = price band, 1 = fabric group, 2 = pattern. 3 and 4 are free (planned: best-seller, margin).
function priceBand(price: number): string {
  if (price < 80) return 'under-80';
  if (price < 100) return '80-100';
  return '100-plus';
}

function fabricGroup(row: FabricRow, title: string): string {
  if (isVinylFabric(row)) return 'vinyl';
  const text = `${title} ${(row.material || []).join(' ')}`.toLowerCase();
  if (text.includes('crypton') || text.includes('performance')) return 'performance';
  if (text.includes('velvet')) return 'velvet';
  if (text.includes('boucl')) return 'boucle';
  if (text.includes('chenille')) return 'chenille';
  if (text.includes('linen')) return 'linen';
  return 'other';
}

// The page description is trimmed to search-snippet length, which can drop the free-samples line.
// Shopping allows far more, so always say it here.
function feedDescription(base: string): string {
  const samples = base.includes('Free samples') ? '' : ' Free samples available.';
  return `${base}${samples} Cut to order by the yard and shipped across Canada.`;
}

// What checkout charges to ship one yard of this fabric (the quantity Google prices), so the listing
// matches checkout even when vinyl's per-yard rate differs. Omitted if the rate table can't be read:
// Merchant Center then falls back to the account's shipping settings.
function shippingXml(row: FabricRow, price: number, rate: ShippingRate | null): string {
  if (!rate?.enabled) return '';
  const free = rate.freeShippingOver !== null && price >= rate.freeShippingOver;
  const cost = free ? 0 : rate.fabricOrderFee + (isVinylFabric(row) ? rate.vinylPerYard : rate.fabricPerYard);
  // Lets Shopping show "Free shipping over $X" when the order would qualify (Admin > Shipping).
  const threshold =
    rate.freeShippingOver !== null && !free
      ? `<g:free_shipping_threshold><g:country>CA</g:country><g:price_threshold>${rate.freeShippingOver.toFixed(2)} CAD</g:price_threshold></g:free_shipping_threshold>`
      : '';
  return `<g:shipping><g:country>CA</g:country><g:service>Standard</g:service><g:price>${cost.toFixed(2)} CAD</g:price></g:shipping>${threshold}`;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response('Catalog not configured', { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const [rows, priceTags] = await Promise.all([
    fetchAllRows<FabricRow>(() =>
      supabase
        .from('charlotte_fabrics')
        .select('legacy_id, name, sku, image_url, fiber_content, durability, width, color, material, pattern, construction_type, availability, manual_retail_price, retail_price, price_tag_id')
        .eq('status', 'active')
    ),
    getFabricPriceTags(),
  ]);
  const shippingRate = await getShippingRate('CA').catch(() => null);
  const priceTagsById = new Map(priceTags.map((tag) => [tag.id, { name: tag.name, pricePerYard: tag.pricePerYard }]));

  const items: string[] = [];
  for (const row of rows) {
    const price = resolveEffectivePrice(
      { manualRetailPrice: row.manual_retail_price ?? undefined, retailPrice: row.retail_price ?? undefined, priceTagId: row.price_tag_id ?? undefined },
      priceTagsById
    ).pricePerYard;
    // Merchant Center rejects products without a price or an image, so leave those out.
    if (price == null || !row.image_url || !row.name || !row.legacy_id) continue;

    const fiber = row.fiber_content || undefined;
    const keywords = fabricKeywords({ color: row.color || [], material: row.material || [] });
    const name = searchFabricName(row.name);
    // Shopping ranks on the title: lead with what people search for, e.g. "Grey Textured Upholstery Fabric".
    const title = `${name} ${keywords ? `${keywords} ` : ''}Upholstery Fabric by the Yard${fiber ? ` – ${fiber}` : ''}`.slice(0, 150);
    const pattern = row.pattern?.[0] ? prettyFacet(row.pattern[0]) : null;
    const fields: [string, string | null | undefined][] = [
      ['g:id', (row.sku || row.legacy_id).slice(0, 50)],
      ['g:title', title],
      ['g:description', feedDescription(describeFabric({ name, fiberContent: fiber, durability: row.durability, width: row.width, pricePerYard: price, keywords }))],
      ['g:link', `${SITE_URL}/fabrics/${encodeURIComponent(row.legacy_id)}`],
      ['g:image_link', row.image_url],
      ['g:availability', row.availability === 'OutOfStock' ? 'out_of_stock' : 'in_stock'],
      ['g:price', `${price.toFixed(2)} CAD`],
      ['g:brand', fabricBrand()],
      ['g:condition', 'new'],
      ['g:identifier_exists', 'no'],
      ['g:google_product_category', GOOGLE_CATEGORY],
      ['g:product_type', pattern ? `Upholstery Fabric > ${pattern}` : 'Upholstery Fabric'],
      ['g:color', row.color?.length ? row.color.slice(0, 3).map(prettyFacet).join('/').slice(0, 100) : null],
      ['g:material', fiber?.slice(0, 200)],
      ['g:unit_pricing_measure', '1 yd'],
      ['g:unit_pricing_base_measure', '1 yd'],
      ['g:custom_label_0', priceBand(price)],
      ['g:custom_label_1', fabricGroup(row, title)],
      ['g:custom_label_2', pattern ? pattern.toLowerCase().slice(0, 100) : 'unspecified'],
    ];
    items.push(
      `<item>${shippingXml(row, price, shippingRate)}${fields
        .filter(([, value]) => value)
        .map(([tag, value]) => `<${tag}>${xml(value!)}</${tag}>`)
        .join('')}</item>`
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${xml(SITE_NAME)} — Upholstery Fabric</title>
<link>${xml(SITE_URL)}</link>
<description>${xml(`${SITE_NAME} upholstery fabric catalog`)}</description>
${items.join('\n')}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
