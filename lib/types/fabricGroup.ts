export interface FabricGroup {
  id: string;
  name: string; // e.g. "Most Selling Fabrics"
  description?: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FabricGroupInput {
  name: string;
  description?: string;
  sortOrder?: number;
}
