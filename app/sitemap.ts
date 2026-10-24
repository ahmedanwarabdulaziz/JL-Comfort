import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';
import { FOAM_PAGES, FOAM_PRODUCTS_LIVE, SITE_URL } from '@/lib/site';
import { COLLECTIONS } from '@/lib/collections/definitions';
import { GUIDES, guideHref } from '@/lib/guides';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import { getFabricPriceTags } from '@/lib/data/fabricPriceTags';

// Rebuilt at most hourly -- new or retired fabrics show up without a redeploy.
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/foam', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/bench-cushions', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/fabrics', priority: 0.9, changeFrequency: 'daily' },
  { path: '/sample-books', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/how-to-measure', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/firmness-guide', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/fibre-wrap', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/shipping-returns', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
];

async function fabricEntries(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  // A plain anon client: the sitemap has no visitor, so there are no session cookies to carry.
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  type Row = {
    legacy_id: string;
    updated_at: string | null;
    image_url: string | null;
    manual_retail_price: number | null;
    retail_price: number | null;
    price_tag_id: string | null;
  };
  const [rows, priceTags] = await Promise.all([
    fetchAllRows<Row>(() =>
      supabase
        .from('charlotte_fabrics')
        .select('legacy_id, updated_at, image_url, manual_retail_price, retail_price, price_tag_id')
        .eq('status', 'active')
    ),
    getFabricPriceTags(),
  ]);
  const priceTagsById = new Map(priceTags.map((tag) => [tag.id, { name: tag.name, pricePerYard: tag.pricePerYard }]));
  // Only fabrics a customer can actually buy: a page with no photo and "Price on request" looks thin
  // to search engines (the fabric page marks those noindex too).
  const listable = (row: Row) =>
    row.image_url &&
    resolveEffectivePrice(
      { manualRetailPrice: row.manual_retail_price ?? undefined, retailPrice: row.retail_price ?? undefined, priceTagId: row.price_tag_id ?? undefined },
      priceTagsById
    ).pricePerYard != null;
  return rows
    .filter((row) => row.legacy_id && listable(row))
    .map((row) => ({
      url: `${SITE_URL}/fabrics/${encodeURIComponent(row.legacy_id)}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fabrics = await fabricEntries().catch((error) => {
    // Still serve the core pages rather than failing the whole sitemap.
    console.error('Sitemap: fabric list failed:', error);
    return [];
  });
  return [
    ...STATIC_PAGES.filter((page) => FOAM_PRODUCTS_LIVE || !FOAM_PAGES.includes(page.path)).map((page) => ({
      url: `${SITE_URL}${page.path === '/' ? '' : page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    { url: `${SITE_URL}/guides`, changeFrequency: 'monthly' as const, priority: 0.6 },
    ...GUIDES.map((guide) => ({
      url: `${SITE_URL}${guideHref(guide.slug)}`,
      lastModified: new Date(guide.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Collection landing pages: the pages most likely to rank for broad searches ("velvet upholstery fabric").
    ...COLLECTIONS.map((collection) => ({
      url: `${SITE_URL}/fabrics/${collection.slug}`,
      changeFrequency: 'weekly' as const,
      priority: collection.group === 'brand' ? 0.9 : collection.group === 'colour' ? 0.7 : 0.8,
    })),
    ...fabrics,
  ];
}
