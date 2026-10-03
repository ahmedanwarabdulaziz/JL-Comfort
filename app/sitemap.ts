import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';
import { SITE_URL } from '@/lib/site';
import { COLLECTIONS } from '@/lib/collections/definitions';

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
  const rows = await fetchAllRows<{ legacy_id: string; updated_at: string | null }>(() =>
    supabase.from('charlotte_fabrics').select('legacy_id, updated_at').eq('status', 'active')
  );
  return rows
    .filter((row) => row.legacy_id)
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
    ...STATIC_PAGES.map((page) => ({
      url: `${SITE_URL}${page.path === '/' ? '' : page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    // Collection landing pages: the pages most likely to rank for broad searches ("velvet upholstery fabric").
    ...COLLECTIONS.map((collection) => ({
      url: `${SITE_URL}/fabrics/${collection.slug}`,
      changeFrequency: 'weekly' as const,
      priority: collection.group === 'colour' ? 0.7 : 0.8,
    })),
    ...fabrics,
  ];
}
