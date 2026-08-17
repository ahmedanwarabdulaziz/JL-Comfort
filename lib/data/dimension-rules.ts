import { supabase } from '@/lib/supabase/client';
import { DimensionRule, DimensionRuleInput } from '@/lib/types/dimension-rules';

const rowToDimensionRule = (row: any): DimensionRule => ({
  id: row.id,
  dimensionType: row.dimension_type || 'width',
  allowFractions: row.allow_fractions ?? true,
  minValue: row.min_value ?? undefined,
  maxValue: row.max_value ?? undefined,
  maxBlockLength: row.max_block_length ?? undefined,
  ranges: row.ranges || [],
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getDimensionRules = async (): Promise<DimensionRule[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('dimension_rules')
    .select('*')
    .order('dimension_type', { ascending: true });

  if (error) {
    console.error('Error fetching dimension rules:', error);
    throw error;
  }
  return (data || []).map(rowToDimensionRule);
};

export const getDimensionRule = async (dimensionType: string): Promise<DimensionRule | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('dimension_rules')
    .select('*')
    .eq('dimension_type', dimensionType)
    .maybeSingle();

  if (error) {
    console.error('Error fetching dimension rule:', error);
    throw error;
  }
  return data ? rowToDimensionRule(data) : null;
};

export const createDimensionRule = async (input: DimensionRuleInput): Promise<DimensionRule> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('dimension_rules')
    .insert({
      dimension_type: input.dimensionType,
      allow_fractions: input.allowFractions,
      min_value: input.minValue,
      max_value: input.maxValue,
      max_block_length: input.maxBlockLength,
      ranges: input.ranges,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating dimension rule:', error);
    throw error;
  }
  return rowToDimensionRule(data);
};

export const updateDimensionRule = async (
  id: string,
  input: Partial<DimensionRuleInput>
): Promise<DimensionRule> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.dimensionType !== undefined) patch.dimension_type = input.dimensionType;
  if (input.allowFractions !== undefined) patch.allow_fractions = input.allowFractions;
  if (input.minValue !== undefined) patch.min_value = input.minValue;
  if (input.maxValue !== undefined) patch.max_value = input.maxValue;
  if (input.maxBlockLength !== undefined) patch.max_block_length = input.maxBlockLength;
  if (input.ranges !== undefined) patch.ranges = input.ranges;

  const { data, error } = await supabase
    .from('dimension_rules')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating dimension rule:', error);
    throw error;
  }
  return rowToDimensionRule(data);
};

export const deleteDimensionRule = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('dimension_rules').delete().eq('id', id);
  if (error) {
    console.error('Error deleting dimension rule:', error);
    throw error;
  }
};

// Helper function to calculate the rounded value based on rules
export const calculateRoundedValue = (
  value: number,
  rule: DimensionRule | null
): number => {
  if (!rule) {
    return value; // No rule, return as-is
  }

  // Check min/max constraints
  if (rule.minValue !== undefined && value < rule.minValue) {
    value = rule.minValue;
  }
  if (rule.maxValue !== undefined && value > rule.maxValue) {
    value = rule.maxValue;
  }

  // Round fractions if not allowed
  if (!rule.allowFractions) {
    value = Math.ceil(value); // Round up to nearest whole number
  }

  // Apply range rules
  if (rule.ranges && rule.ranges.length > 0) {
    // Sort ranges by min value
    const sortedRanges = [...rule.ranges].sort((a, b) => a.min - b.min);

    for (const range of sortedRanges) {
      const max = range.max ?? Infinity;
      if (value >= range.min && value < max) {
        return range.roundTo;
      }
    }
  }

  return value;
};
