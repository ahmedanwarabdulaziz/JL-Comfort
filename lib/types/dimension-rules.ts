import { Timestamp } from 'firebase/firestore';
import { DimensionType } from './foam';

export interface RangeRule {
  min: number; // Minimum value (inclusive)
  max: number | null; // Maximum value (exclusive, null means no upper limit)
  roundTo: number; // Round up to this value
}

export interface DimensionRule {
  id: string;
  dimensionType: DimensionType; // 'width' | 'depth' | 'thickness'
  allowFractions: boolean; // Whether to accept fractional values
  minValue?: number; // Minimum allowed value in inches (optional)
  maxValue?: number; // Maximum allowed value in inches (optional)
  ranges: RangeRule[]; // Array of range rules for rounding calculations
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface DimensionRuleInput {
  dimensionType: DimensionType;
  allowFractions: boolean;
  minValue?: number;
  maxValue?: number;
  ranges: RangeRule[];
}
