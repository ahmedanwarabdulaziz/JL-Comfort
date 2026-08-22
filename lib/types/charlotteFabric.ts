export type CharlotteFabricAvailability = 'InStock' | 'OutOfStock';
export type CharlotteFabricStatus = 'active' | 'inactive';

export interface CharlotteFabric {
  id: string; // slug derived from productUrl, e.g. "d5087-navy"
  name: string;
  sku: string;
  productUrl: string;
  imageUrl: string;
  imageOk: boolean;

  // Facets — only knowable by which filter surfaced the product on charlottefabrics.com
  color: string[];
  pattern: string[];
  material: string[];

  // Specs — scraped from the product page's spec table, field set varies per product
  applications: string[];
  markets: string[];
  fiberContent?: string;
  durability?: string;
  width?: string;
  repeat?: string;
  patternDirection?: string;
  cleanability?: string;
  flammability?: string;
  origin?: string;
  features?: string;
  performance?: string;
  specs: Record<string, string>; // raw label -> value catch-all, includes the fields above

  availability: CharlotteFabricAvailability;

  status: CharlotteFabricStatus;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastCheckedAt: Date;

  priceTagId?: string | null; // references a FabricPriceTag; null/unset = use the default tag's rate
  groupIds?: string[]; // FabricGroup ids this item has been curated into

  // From the Charlotte Fabrics master spreadsheet (data/charlotte-fabrics/master-spreadsheet.xlsx),
  // merged in by SKU via scripts/import-charlotte-master-spreadsheet.js. Not scrapable from the
  // product page, so these are additive-only fields layered onto the scraped data above.
  costPrice?: number; // "Your Price (Including Tariff)" — actual dealer cost per yard
  mapPrice?: number; // "Minimum Advertised Price"
  retailPrice?: number; // "Retail (Including Tariff)" — MSRP
  colorwayGroup?: string; // "Colorway Group #" — links colorways of the same pattern
  brand?: string; // "Brand" — e.g. "Charlotte Colors", "Performance Colors"
  sampleBooks?: string[]; // "Sample Book(s)"
  ecoFriendly?: string[]; // "Eco Friendly" certifications
  constructionType?: string[]; // "Type" — construction category (Velvet, Crypton, Woven Patterns, ...)
  properties?: string[]; // "Properties" — Stain Resistant, Pet Friendly, Made In America, ...
  isNew?: boolean; // "New" column
  masterSpreadsheetImportedAt?: Date;

  // Admin-set price override — always wins over retailPrice/priceTagId. Kept as a separate field
  // (rather than writing straight into retailPrice) so a future spreadsheet re-import can't
  // silently clobber a manual edit. null = explicitly cleared back to retailPrice/tag pricing.
  manualRetailPrice?: number | null;
}

/**
 * The shape of an item inside the published R2 catalog snapshot (scripts/sync-charlotte-fabrics.js
 * publishSnapshot). pricePerYard/priceTagName are resolved once at publish time (tag if assigned,
 * else the default tag) — computed, not stored per-Firestore-doc, so they live here rather than on
 * CharlotteFabric itself.
 */
export interface CharlotteFabricSnapshotItem extends CharlotteFabric {
  pricePerYard: number | null;
  priceTagName: string | null;
}

export interface CharlotteFabricFilters {
  color?: string;
  pattern?: string;
  material?: string;
  application?: string;
  market?: string;
  search?: string; // matched against name/sku
  priceTagId?: string; // "__untagged__" matches items with no priceTagId (using the default rate)
  groupId?: string;
  sampleBook?: string; // matched against fabric.sampleBooks[]
}

export type CharlotteFabricsSyncRunStatus = 'running' | 'success' | 'failed';
export type CharlotteFabricsSyncPhase =
  | 'discovering-catalog'
  | 'crawling-facets'
  | 'fetching-products'
  | 'diffing'
  | 'done';

export interface CharlotteFabricsSyncRunTotals {
  scanned: number;
  added: number;
  updated: number;
  deactivated: number;
  brokenImages: number;
  errors: number;
  structuralWarnings: number; // pages that returned 200 but didn't match expected markup — site layout may have changed
}

export interface CharlotteFabricsSyncRun {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  lastUpdatedAt: Date; // bumped on every checkpoint; used to detect a run that silently died
  status: CharlotteFabricsSyncRunStatus;
  phase: CharlotteFabricsSyncPhase;
  discovered: number; // total unique products found in Phase A; 0 until that phase completes
  totals: CharlotteFabricsSyncRunTotals;
  errorLog: string[];
}
