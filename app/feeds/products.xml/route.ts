import { createClient } from '@supabase/supabase-js';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import { getFabricPriceTags } from '@/lib/data/fabricPriceTags';
import { describeFabric, prettyFacet } from '@/lib/seo/fabric';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { fabricKeywords } from '@/lib/collections/definitions';

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
  availability: string | null;
  manual_retail_price: number | null;
  retail_price: number | null;
  price_tag_id: string | null;
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
        .select('legacy_id, name, sku, image_url, fiber_content, durability, width, color, material, pattern, availability, manual_retail_price, retail_price, price_tag_id')
        .eq('status', 'active')
    ),
    getFabricPriceTags(),
  ]);
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
    // Shopping ranks on the title: lead with what people search for, e.g. "Grey Textured Upholstery Fabric".
    const title = `${row.name} ${keywords ? `${keywords} ` : ''}Upholstery Fabric by the Yard${fiber ? ` – ${fiber}` : ''}`.slice(0, 150);
    const pattern = row.pattern?.[0] ? prettyFacet(row.pattern[0]) : null;
    const fields: [string, string | null | undefined][] = [
      ['g:id', (row.sku || row.legacy_id).slice(0, 50)],
      ['g:title', title],
      ['g:description', describeFabric({ name: row.name, fiberContent: fiber, durability: row.durability, width: row.width, pricePerYard: price, keywords })],
      ['g:link', `${SITE_URL}/fabrics/${encodeURIComponent(row.legacy_id)}`],
      ['g:image_link', row.image_url],
      ['g:availability', row.availability === 'OutOfStock' ? 'out_of_stock' : 'in_stock'],
      ['g:price', `${price.toFixed(2)} CAD`],
      ['g:brand', SITE_NAME],
      ['g:condition', 'new'],
      ['g:identifier_exists', 'no'],
      ['g:google_product_category', GOOGLE_CATEGORY],
      ['g:product_type', pattern ? `Upholstery Fabric > ${pattern}` : 'Upholstery Fabric'],
      ['g:color', row.color?.length ? row.color.slice(0, 3).map(prettyFacet).join('/').slice(0, 100) : null],
      ['g:material', fiber?.slice(0, 200)],
      ['g:unit_pricing_measure', '1 yd'],
      ['g:unit_pricing_base_measure', '1 yd'],
    ];
    items.push(
      `<item>${fields
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
