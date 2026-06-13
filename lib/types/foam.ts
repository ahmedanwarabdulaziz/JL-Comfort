import { Timestamp } from 'firebase/firestore';

export type DimensionType = 'width' | 'depth' | 'thickness';

export interface FoamDimension {
  type: DimensionType; // Standard type: width, depth, or thickness
  name: string; // Custom name: e.g., "width", "top width", "bottom width", "depth", "thickness"
  value: number; // dimension value (will be editable by customer)
  unit?: string; // Always "inch" (optional, defaults to "inch")
  letterShortcut?: string; // Letter shortcut for image reference (e.g., "A", "B", "W", "D")
}

export interface FoamType {
  id: string;
  categoryId: string; // Reference to category document ID
  name: string;
  description: string;
  imageUrl: string | null;
  svgId?: string; // e.g., 'rectangle', 'chair-seat-b', or 'custom'
  customSvgContent?: string; // raw SVG string if svgId is 'custom'
  dimensions: FoamDimension[]; // Array of dimensions for this foam type
  sortOrder?: number; // Order for sorting/displaying
  createdAt: Date;
  updatedAt: Date;
}

export interface FoamTypeInput {
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  svgId?: string;
  customSvgContent?: string;
  dimensions: FoamDimension[];
  sortOrder?: number; // Optional, will be set automatically if not provided
}
