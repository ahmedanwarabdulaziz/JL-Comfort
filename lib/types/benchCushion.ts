import { Timestamp } from 'firebase/firestore';
import { FoamDimension } from './foam';

export interface CushionVariableOption {
  label: string; // e.g. "Box Edge", "Button Tufted", "No Piping"
  priceModifier: number; // added to basePrice when this option is selected
  imageUrl?: string | null; // swatch image, e.g. a color or fabric photo
}

export interface CushionVariable {
  name: string; // e.g. "Edge Style", "Fill Type", "Tufting", "Piping"
  options: CushionVariableOption[];
}

export interface BenchCushionStyle {
  id: string;
  name: string;
  description: string;
  images: string[]; // gallery of reference images
  dimensions: FoamDimension[]; // core shape dimensions, editable by customer
  variables: CushionVariable[]; // cushion-specific style options
  basePrice: number;
  currency: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenchCushionStyleInput {
  name: string;
  description: string;
  images: string[];
  dimensions: FoamDimension[];
  variables: CushionVariable[];
  basePrice: number;
  currency: string;
  sortOrder?: number;
}
