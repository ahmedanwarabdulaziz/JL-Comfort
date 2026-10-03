export interface FabricGroup {
  id: string;
  name: string; // e.g. "Most Selling Fabrics"
  description?: string;
  sortOrder?: number;
  showOnHomepage: boolean;
  coverImageUrl?: string | null; // uploaded photo shown on the homepage tile; null/unset = use member fabric photos
  createdAt: Date;
  updatedAt: Date;
}

export interface FabricGroupInput {
  name: string;
  description?: string;
  sortOrder?: number;
  showOnHomepage?: boolean;
  coverImageUrl?: string | null;
}

/** A fabric that belongs to a group, as shown in the group's member manager. */
export interface FabricGroupMember {
  fabricId: string;
  name: string;
  sku: string;
  imageUrl: string;
  isFeatured: boolean; // used as a homepage cover photo when the group is shown there
}

/** A catalog fabric matched while searching to add to a group. */
export interface FabricSearchResult {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
}
