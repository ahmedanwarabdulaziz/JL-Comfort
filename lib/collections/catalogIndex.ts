import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import { comboCollections, fabricMatchesRule, type FabricTags } from './definitions';
import { cleanBookName, isRingBookPage, sampleBookSlug } from '@/lib/sampleBooks';

// One pass over the whole catalog, cached for 30 minutes, that the generated pages depend on:
// - how many fabrics each colour + type page would have (only those with enough are published), and
// - the Charlotte sample books, grouped by name, with what's in each (for /sample-books/<slug>).
// Only fabrics a customer can buy count: active, pictured and priced -- the same as collection pages.

export interface SampleBookEntry {
  slug: string;
  name: string; // "Textured Plains II"
  raws: string[]; // every sample_books value for it ("Textured Plains II & Ring Book Page #4", ...)
  count: number;
  newCount: number;
  materials: string[]; // most common first: ['tweed-textures', 'woven-patterns']
  colours: string[]; // most common first: ['grey-silver', 'beige-taupe']
  performanceShare: number; // 0-1
  outdoorShare: number;
  contractShare: number;
  photo: string | null;
}

export interface CatalogIndex {
  comboCounts: Record<string, number>; // colour + type slug -> fabrics
  books: SampleBookEntry[]; // biggest first
}

interface Row extends FabricTags {
  image_url: string | null;
  is_new: boolean | null;
  sample_books: string[] | null;
  manual_retail_price: number | null;
  retail_price: number | null;
  price_tag_id: string | null;
}

const byCount = (counts: Map<string, number>) => [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key);
const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) || 0) + 1);

async function buildIndex(): Promise<CatalogIndex> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { comboCounts: {}, books: [] };
  const db = createClient(url, key, { auth: { persistSession: false } });

  const [rows, tags] = await Promise.all([
    fetchAllRows<any>(() =>
      db
        .from('charlotte_fabrics')
        .select('image_url, is_new, sample_books, material, pattern, color, properties, markets, applications, cleanability, durability, manual_retail_price, retail_price, price_tag_id')
        .eq('status', 'active')
        .not('image_url', 'is', null)
    ),
    db.from('fabric_price_tags').select('id, name, price_per_yard'),
  ]);
  if (tags.error) throw tags.error;
  const priceTagsById = new Map((tags.data || []).map((t) => [t.id as string, { name: t.name as string, pricePerYard: (t.price_per_yard ?? 0) as number }]));

  const fabrics: Row[] = (rows as any[])
    .filter((row) => row.image_url)
    .filter(
      (row) =>
        resolveEffectivePrice(
          { manualRetailPrice: row.manual_retail_price ?? undefined, retailPrice: row.retail_price ?? undefined, priceTagId: row.price_tag_id ?? undefined },
          priceTagsById
        ).pricePerYard != null
    )
    .map((row) => ({ ...row, cleanability: row.cleanability ?? undefined, durability: row.durability ?? undefined }));

  const comboCounts: Record<string, number> = {};
  for (const combo of comboCollections()) {
    comboCounts[combo.slug] = fabrics.filter((fabric) => fabricMatchesRule(combo.rule, fabric)).length;
  }

  const groups = new Map<string, { name: string; raws: Set<string>; rows: Row[] }>();
  for (const fabric of fabrics) {
    const seen = new Set<string>();
    for (const raw of fabric.sample_books || []) {
      const name = cleanBookName(raw);
      if (!name || isRingBookPage(name) || seen.has(name)) continue;
      seen.add(name);
      const group = groups.get(name) || { name, raws: new Set<string>(), rows: [] };
      group.raws.add(raw.trim());
      group.rows.push(fabric);
      groups.set(name, group);
    }
    // A fabric listed under two raw names of the same book still adds both raw names.
    for (const raw of fabric.sample_books || []) {
      const name = cleanBookName(raw);
      groups.get(name)?.raws.add(raw.trim());
    }
  }

  const usedSlugs = new Set<string>();
  const books = [...groups.values()]
    .sort((a, b) => b.rows.length - a.rows.length)
    .map((group): SampleBookEntry => {
      let slug = sampleBookSlug(group.name);
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${sampleBookSlug(group.name)}-${n}`;
      usedSlugs.add(slug);
      const materials = new Map<string, number>();
      const colours = new Map<string, number>();
      let performance = 0;
      let outdoor = 0;
      let contract = 0;
      for (const row of group.rows) {
        (row.material || []).forEach((m) => bump(materials, m));
        (row.color || []).forEach((c) => bump(colours, c));
        if ((row.properties || []).some((p) => p === 'Performance Grade' || p === 'Stain Resistant')) performance++;
        if ((row.markets || []).some((m) => /outdoor|marine/i.test(m))) outdoor++;
        if ((row.markets || []).includes('Contract')) contract++;
      }
      const n = group.rows.length;
      return {
        slug,
        name: group.name,
        raws: [...group.raws],
        count: n,
        newCount: group.rows.filter((r) => r.is_new).length,
        materials: byCount(materials),
        colours: byCount(colours),
        performanceShare: performance / n,
        outdoorShare: outdoor / n,
        contractShare: contract / n,
        photo: group.rows[0]?.image_url || null,
      };
    });

  return { comboCounts, books };
}

export const getCatalogIndex = unstable_cache(buildIndex, ['catalog-index-v2'], { revalidate: 1800 });

// Colour + type pages that have enough fabrics to publish.
export async function publishedComboSlugs(): Promise<Set<string>> {
  const { comboCounts } = await getCatalogIndex();
  const combos = comboCollections();
  return new Set(combos.filter((c) => (comboCounts[c.slug] || 0) >= (c.minFabrics || 0)).map((c) => c.slug));
}

export async function getSampleBook(slug: string): Promise<SampleBookEntry | undefined> {
  return (await getCatalogIndex()).books.find((book) => book.slug === slug);
}
