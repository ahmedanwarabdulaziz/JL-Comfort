export interface FabricPriceRange {
  id: string;
  name: string; // e.g. "Economy Fabrics", "Standard", "Premium"
  minPrice: number; // inclusive
  maxPrice: number | null; // inclusive; null = open-ended top band
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FabricPriceRangeInput {
  name: string;
  minPrice: number;
  maxPrice: number | null;
  sortOrder?: number;
}

/** First range whose [minPrice, maxPrice] bracket contains price, or null if none match / price is null. */
export const resolvePriceRange = (
  price: number | null | undefined,
  ranges: FabricPriceRange[]
): FabricPriceRange | null => {
  if (price == null) return null;
  return ranges.find((r) => price >= r.minPrice && (r.maxPrice === null || price <= r.maxPrice)) || null;
};
