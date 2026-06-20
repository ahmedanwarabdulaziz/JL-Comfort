export interface FabricItem {
  id: string;
  name: string;
  imageUrl: string;
  swatchColor?: string; // CSS color or gradient for JL Comfort fabrics without images
  color: string[];
  style: string[];
  fabricType: string;
  source: 'charlotte-fabrics' | 'jl-comfort';
  productUrl?: string;
  price?: string;
  description?: string;
  tags: string[];
  geminiReason?: string; // AI-generated reason for recommendation
}

export interface VisualizationResult {
  fabric: FabricItem;
  visualizedImageBase64: string;
  mimeType: string;
}

export interface PreferencesState {
  style: string;
  colors: string[];
  fabricType: string;
}

export type VisualizerStep = 1 | 2 | 3 | 4;
