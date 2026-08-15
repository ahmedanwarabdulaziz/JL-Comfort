import { CharlotteFabric } from '../types/charlotteFabric';

export interface EffectivePrice {
  pricePerYard: number | null;
  priceTagName: string | null; // customer-facing "(<name>, N yd)" caption; null degrades gracefully
  source: 'override' | 'retail' | 'tag' | null; // for the admin table's chip, not exposed publicly
}

/**
 * Single source of truth for what price a Charlotte Fabric shows, wherever pricing is resolved
 * (public snapshot publish, the admin catalog table): a manual admin override always wins, then
 * the real per-SKU retail price from the master spreadsheet import, then the flat price-tag rate
 * as a last resort for items the spreadsheet hasn't priced yet.
 *
 * scripts/sync-charlotte-fabrics.js re-implements this same precedence inline, since it's a plain
 * Node/CommonJS script that can't require() this .ts file — keep the two in sync if this changes.
 */
export function resolveEffectivePrice(
  fabric: Pick<CharlotteFabric, 'manualRetailPrice' | 'retailPrice' | 'priceTagId'>,
  priceTagsById: Map<string, { name?: string; pricePerYard?: number }>
): EffectivePrice {
  if (fabric.manualRetailPrice != null) {
    return { pricePerYard: fabric.manualRetailPrice, priceTagName: null, source: 'override' };
  }
  if (fabric.retailPrice != null) {
    return { pricePerYard: fabric.retailPrice, priceTagName: null, source: 'retail' };
  }
  const tag = fabric.priceTagId ? priceTagsById.get(fabric.priceTagId) : null;
  if (tag) {
    return { pricePerYard: tag.pricePerYard ?? null, priceTagName: tag.name ?? null, source: 'tag' };
  }
  return { pricePerYard: null, priceTagName: null, source: null };
}
