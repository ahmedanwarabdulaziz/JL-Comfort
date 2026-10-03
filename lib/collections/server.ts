import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import type { FabricCollection } from './definitions';

export const COLLECTION_PAGE_SIZE = 48;

// How long a collection's fabric list is reused before it's read from the database again. The shared
// client in lib/supabase/client.ts turns caching off, which would make every page view re-query
// thousands of rows; collection pages can be up to this stale, like the rest of the catalog.
export const COLLECTION_REVALIDATE_SECONDS = 1800;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const cachedDb =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false },
        global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: COLLECTION_REVALIDATE_SECONDS } }) },
      })
    : undefined;

// Just what a product card needs (see components/fabrics/FabricCard.tsx).
export interface CollectionFabric {
  id: string; // the /fabrics/<slug> slug
  name: string;
  sku: string;
  imageUrl: string;
  pricePerYard: number;
  isNew: boolean;
  inStock: boolean;
  colorwayGroup: string | null;
}

interface Row {
  legacy_id: string;
  name: string | null;
  sku: string | null;
  image_url: string | null;
  is_new: boolean | null;
  availability: string | null;
  colorway_group: string | null;
  durability: string | null;
  manual_retail_price: number | null;
  retail_price: number | null;
  price_tag_id: string | null;
}

// "Exceeds 100,000 Wyzenbeek Rubs (Heavy Duty)" -> 100000
const doubleRubs = (durability: string | null) => {
  const match = durability?.replace(/,/g, '').match(/(\d{4,7})/);
  return match ? Number(match[1]) : 0;
};

// Every priced, pictured, active fabric in a collection: in-stock first, then new arrivals, then by
// name. cache() shares one database read between generateMetadata and the page in a request.
export const loadCollectionFabrics = cache(async (collection: FabricCollection): Promise<CollectionFabric[]> => {
  if (!cachedDb) throw new Error('Collection page: Supabase is not configured.');
  const db = cachedDb;
  const { rule } = collection;

  const [rows, priceTags] = await Promise.all([
    fetchAllRows<Row>(() => {
      // Typed loosely: chaining optional filters otherwise makes TypeScript's query types explode.
      let query: any = db
        .from('charlotte_fabrics')
        .select('legacy_id, name, sku, image_url, is_new, availability, colorway_group, durability, manual_retail_price, retail_price, price_tag_id')
        .eq('status', 'active')
        .not('image_url', 'is', null);
      if (rule.material) query = query.overlaps('material', rule.material);
      if (rule.pattern) query = query.overlaps('pattern', rule.pattern);
      if (rule.color) query = query.overlaps('color', rule.color);
      if (rule.properties) query = query.overlaps('properties', rule.properties);
      if (rule.markets) query = query.overlaps('markets', rule.markets);
      if (rule.applications) query = query.overlaps('applications', rule.applications);
      if (rule.cleanabilityContains) query = query.ilike('cleanability', `%${rule.cleanabilityContains}%`);
      if (rule.minDoubleRubs) query = query.not('durability', 'is', null);
      return query;
    }),
    db.from('fabric_price_tags').select('id, name, price_per_yard'),
  ]);
  if (priceTags.error) throw priceTags.error;
  const priceTagsById = new Map(
    (priceTags.data || []).map((tag) => [tag.id as string, { name: tag.name as string, pricePerYard: (tag.price_per_yard ?? 0) as number }])
  );

  const fabrics: CollectionFabric[] = [];
  for (const row of rows) {
    if (!row.legacy_id || !row.name || !row.image_url) continue;
    if (rule.minDoubleRubs && doubleRubs(row.durability) < rule.minDoubleRubs) continue;
    const price = resolveEffectivePrice(
      { manualRetailPrice: row.manual_retail_price ?? undefined, retailPrice: row.retail_price ?? undefined, priceTagId: row.price_tag_id ?? undefined },
      priceTagsById
    ).pricePerYard;
    if (price == null) continue; // unpriced fabrics are never shown to customers
    fabrics.push({
      id: row.legacy_id,
      name: row.name,
      sku: row.sku || '',
      imageUrl: row.image_url,
      pricePerYard: price,
      isNew: !!row.is_new,
      inStock: row.availability !== 'OutOfStock',
      colorwayGroup: row.colorway_group,
    });
  }

  return fabrics.sort(
    (a, b) => Number(b.inStock) - Number(a.inStock) || Number(b.isNew) - Number(a.isNew) || a.name.localeCompare(b.name)
  );
});
