import { calculateRoundedValue } from '@/lib/data/dimension-rules';
import { DimensionRule } from '@/lib/types/dimension-rules';
import { DimensionType } from '@/lib/types/foam';

export interface FoamPriceInput {
  rawThickness: number;
  rawDepth: number;
  rawWidth: number;
  gradePricePerCubicFoot: number;
  wrapValuePerCubicFoot: number | null; // null = no fibre wrap
  rules: DimensionRule[];
}

export interface FoamPrice {
  thickness: number;
  depth: number;
  width: number;
  volume: number; // cubic feet, from the rounded dimensions
  foamPrice: number;
  wrapPrice: number;
  unitPrice: number;
}

/**
 * The one foam price formula, shared by the foam configurator (what the customer sees) and
 * /api/checkout (what they're charged): round each raw dimension up per the admin's dimension
 * rules, volume = T × D × W / 144, then grade $/cu ft × volume plus fibre wrap $/cu ft × volume.
 */
export const computeFoamPrice = (input: FoamPriceInput): FoamPrice => {
  const ruleFor = (type: DimensionType) => input.rules.find((rule) => rule.dimensionType === type) || null;
  const thickness = calculateRoundedValue(input.rawThickness, ruleFor('thickness'));
  const depth = calculateRoundedValue(input.rawDepth, ruleFor('depth'));
  const width = calculateRoundedValue(input.rawWidth, ruleFor('width'));
  const volume = (thickness * depth * width) / 144;
  const foamPrice = volume * input.gradePricePerCubicFoot;
  const wrapPrice = input.wrapValuePerCubicFoot === null ? 0 : input.wrapValuePerCubicFoot * volume;
  return { thickness, depth, width, volume, foamPrice, wrapPrice, unitPrice: foamPrice + wrapPrice };
};
