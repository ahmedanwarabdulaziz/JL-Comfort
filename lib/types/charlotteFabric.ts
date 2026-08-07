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
}

export interface CharlotteFabricFilters {
  color?: string;
  pattern?: string;
  material?: string;
  application?: string;
  market?: string;
  search?: string; // matched against name/sku
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
