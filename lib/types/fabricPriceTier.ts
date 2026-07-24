export interface FabricPriceTier {
  id: string;
  name: string; // e.g. "Standard", "Performance", "Premium"
  pricePerYard: number;
  materials: string[]; // material facet slugs (from charlotteFabricFacets) bucketed into this tier
  isDefault?: boolean; // used when no material filter is active, or no tier matches
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FabricPriceTierInput {
  name: string;
  pricePerYard: number;
  materials: string[];
  isDefault?: boolean;
  sortOrder?: number;
}
