import { supabase } from '@/lib/supabase/client';
import {
  CharlotteFabric,
  CharlotteFabricFilters,
  CharlotteFabricSnapshotItem,
  CharlotteFabricsSyncRun,
} from '@/lib/types/charlotteFabric';

// Postgres has no Firestore-style operation-count cap, but we still chunk bulk
// updates to keep any single PostgREST request reasonably sized.
const REQUEST_CHUNK_SIZE = 500;
const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

/** Sentinel value for the "Unpriced (no tag)" price-tag filter option. */
export const UNTAGGED_PRICE_TAG_FILTER = '__untagged__';

const rowToCharlotteFabric = (row: any): CharlotteFabric => ({
  id: row.id,
  name: row.name || '',
  sku: row.sku || '',
  productUrl: row.product_url || '',
  imageUrl: row.image_url || '',
  imageOk: row.image_ok ?? true,
  color: row.color || [],
  pattern: row.pattern || [],
  material: row.material || [],
  applications: row.applications || [],
  markets: row.markets || [],
  fiberContent: row.fiber_content || '',
  durability: row.durability || '',
  width: row.width || '',
  repeat: row.repeat || '',
  patternDirection: row.pattern_direction || '',
  cleanability: row.cleanability || '',
  flammability: row.flammability || '',
  origin: row.origin || '',
  features: row.features || '',
  performance: row.performance || '',
  specs: row.specs || {},
  availability: row.availability || 'InStock',
  status: row.status || 'active',
  firstSeenAt: new Date(row.first_seen_at),
  lastSeenAt: new Date(row.last_seen_at),
  lastCheckedAt: new Date(row.last_checked_at),
  priceTagId: row.price_tag_id ?? null,
  groupIds: (row.fabric_group_members || []).map((m: any) => m.group_id),
  costPrice: row.cost_price,
  mapPrice: row.map_price,
  retailPrice: row.retail_price,
  colorwayGroup: row.colorway_group,
  brand: row.brand,
  sampleBooks: row.sample_books,
  ecoFriendly: row.eco_friendly,
  constructionType: row.construction_type,
  properties: row.properties,
  isNew: row.is_new,
  masterSpreadsheetImportedAt: row.master_spreadsheet_imported_at
    ? new Date(row.master_spreadsheet_imported_at)
    : undefined,
  manualRetailPrice: row.manual_retail_price,
});

/** Fetches every active Charlotte Fabrics catalog item. Filtering happens client-side via filterFabrics(). */
export const getCharlotteFabrics = async (): Promise<CharlotteFabric[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('charlotte_fabrics')
    .select('*, fabric_group_members(group_id)')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching Charlotte Fabrics catalog:', error);
    return [];
  }
  return (data || []).map(rowToCharlotteFabric);
};

// Same public R2 bucket URL/fallback as lib/cloudflare/r2.ts, exposed with the NEXT_PUBLIC_
// prefix since this fetch runs in the browser (the gallery is a client component).
const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-7e5f5ae157894c8c95bbc5f77e2929f0.r2.dev';
const CATALOG_SNAPSHOT_URL = `${R2_PUBLIC_URL}/catalog/charlotte-fabrics.json`;

/**
 * Fetches the pre-synced catalog snapshot scripts/sync-charlotte-fabrics.js publishes to R2
 * after each run. Used by the public storefront so a visitor page view never queries the
 * database directly — unlike getCharlotteFabrics() above, which the low-traffic admin table still
 * uses for the freshest data. Returns [] (rather than throwing) if no snapshot has been published yet.
 */
export const getCharlotteFabricsSnapshot = async (): Promise<CharlotteFabricSnapshotItem[]> => {
  try {
    // `next.revalidate` matches the R2 object's own Cache-Control window (see
    // SNAPSHOT_CACHE_CONTROL in scripts/sync-charlotte-fabrics.js) — lets server-side callers
    // (fabric-search API route) reuse the response instead of re-fetching this ~10MB file on
    // every request. Ignored harmlessly by the browser's native fetch on the client.
    // Added ?v=1 to bust the 30-minute Cloudflare cache and force browsers to pull the latest schema
    const res = await fetch(`${CATALOG_SNAPSHOT_URL}?v=1`, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      ...item,
      firstSeenAt: item.firstSeenAt ? new Date(item.firstSeenAt) : new Date(),
      lastSeenAt: item.lastSeenAt ? new Date(item.lastSeenAt) : new Date(),
      lastCheckedAt: item.lastCheckedAt ? new Date(item.lastCheckedAt) : new Date(),
      pricePerYard: item.pricePerYard ?? null,
      priceTagName: item.priceTagName ?? null,
    }));
  } catch (error) {
    console.error('Error fetching Charlotte Fabrics catalog snapshot:', error);
    return [];
  }
};

/** Client-side filtering shared by the gallery and the admin catalog table. Generic so it preserves
 *  extra fields on the input (e.g. CharlotteFabricSnapshotItem's pricePerYard/priceTagName). */
export const filterFabrics = <T extends CharlotteFabric>(
  fabrics: T[],
  filters: CharlotteFabricFilters
): T[] => {
  const search = filters.search?.trim().toLowerCase();

  return fabrics.filter((fabric) => {
    if (filters.color && !fabric.color.includes(filters.color)) return false;
    if (filters.pattern && !fabric.pattern.includes(filters.pattern)) return false;
    if (filters.material && !fabric.material.includes(filters.material)) return false;
    if (filters.application && !fabric.applications.includes(filters.application)) return false;
    if (filters.market && !fabric.markets.includes(filters.market)) return false;
    if (filters.priceTagId) {
      if (filters.priceTagId === UNTAGGED_PRICE_TAG_FILTER) {
        if (fabric.priceTagId) return false;
      } else if (fabric.priceTagId !== filters.priceTagId) {
        return false;
      }
    }
    if (filters.groupId && !(fabric.groupIds || []).includes(filters.groupId)) return false;
    if (filters.sampleBook && !(fabric.sampleBooks || []).some((b) => b.trim() === filters.sampleBook)) return false;
    if (search) {
      const haystack = `${fabric.name} ${fabric.sku}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
};

/** Bulk-assigns one price tag to every given Charlotte Fabric row id. */
export const bulkAssignPriceTag = async (ids: string[], priceTagId: string): Promise<void> => {
  if (!supabase || ids.length === 0) return;
  for (const group of chunk(ids, REQUEST_CHUNK_SIZE)) {
    const { error } = await supabase
      .from('charlotte_fabrics')
      .update({ price_tag_id: priceTagId })
      .in('id', group);
    if (error) {
      console.error('Error bulk-assigning price tag:', error);
      throw error;
    }
  }
};

/** Bulk-adds every given Charlotte Fabric row id to a group, without disturbing existing group membership. */
export const bulkAddToGroup = async (ids: string[], groupId: string): Promise<void> => {
  if (!supabase || ids.length === 0) return;
  for (const group of chunk(ids, REQUEST_CHUNK_SIZE)) {
    const { error } = await supabase
      .from('fabric_group_members')
      .upsert(
        group.map((fabricId) => ({ fabric_id: fabricId, group_id: groupId })),
        { onConflict: 'fabric_id,group_id', ignoreDuplicates: true }
      );
    if (error) {
      console.error('Error bulk-adding to group:', error);
      throw error;
    }
  }
};

/**
 * Sets (or clears, with null) a manual price override on a single Charlotte Fabric row. Always
 * wins over retailPrice/priceTagId — see resolveEffectivePrice in charlotteFabricPricing.ts.
 */
export const setFabricManualPrice = async (id: string, manualRetailPrice: number | null): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase
    .from('charlotte_fabrics')
    .update({ manual_retail_price: manualRetailPrice })
    .eq('id', id);
  if (error) {
    console.error('Error setting manual price:', error);
    throw error;
  }
};

const rowToSyncRun = (row: any): CharlotteFabricsSyncRun => ({
  id: row.id,
  startedAt: new Date(row.started_at),
  finishedAt: row.finished_at ? new Date(row.finished_at) : null,
  lastUpdatedAt: new Date(row.last_updated_at || row.started_at),
  status: row.status || 'running',
  phase: row.phase || 'crawling-facets',
  discovered: row.discovered ?? 0,
  totals: {
    scanned: row.scanned ?? 0,
    added: row.added ?? 0,
    updated: row.updated ?? 0,
    deactivated: row.deactivated ?? 0,
    brokenImages: row.broken_images ?? 0,
    errors: row.errors ?? 0,
    structuralWarnings: row.structural_warnings ?? 0,
  },
  errorLog: row.error_log || [],
});

/** Fetches the most recent sync run, for the admin status dashboard. */
export const getLatestSyncRun = async (): Promise<CharlotteFabricsSyncRun | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('charlotte_fabric_sync_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching latest Charlotte Fabrics sync run:', error);
    return null;
  }
  return data ? rowToSyncRun(data) : null;
};

/**
 * Live-subscribes to the most recent sync run, for real-time progress in the admin dashboard.
 * Returns an unsubscribe function; call it on cleanup (e.g. a useEffect return). RLS on
 * charlotte_fabric_sync_runs is admin-only-read, so this naturally only delivers events to an
 * authenticated admin session.
 */
export const subscribeToLatestSyncRun = (
  onChange: (run: CharlotteFabricsSyncRun | null) => void
): (() => void) => {
  const client = supabase;
  if (!client) {
    onChange(null);
    return () => {};
  }

  getLatestSyncRun().then(onChange);

  const channel = client
    .channel('charlotte-fabric-sync-runs-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'charlotte_fabric_sync_runs' },
      () => {
        getLatestSyncRun().then(onChange);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};
