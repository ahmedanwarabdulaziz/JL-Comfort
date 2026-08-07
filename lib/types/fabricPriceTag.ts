export interface FabricPriceTag {
  id: string;
  name: string; // e.g. "Economy", "Standard", "Premium"
  pricePerYard: number;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FabricPriceTagInput {
  name: string;
  pricePerYard: number;
  sortOrder?: number;
}
