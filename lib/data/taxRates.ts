import { supabase } from '@/lib/supabase/client';
import { TaxRate, TaxRateInput } from '@/lib/types/checkout';

const rowToTaxRate = (row: any): TaxRate => ({
  id: row.id,
  country: row.country,
  regionCode: row.region_code,
  regionName: row.region_name || '',
  taxName: row.tax_name || '',
  rate: Number(row.rate ?? 0),
  appliesToShipping: row.applies_to_shipping ?? true,
  enabled: row.enabled ?? true,
  sortOrder: row.sort_order ?? 0,
});

const inputToRow = (input: Partial<TaxRateInput>) => {
  const row: Record<string, unknown> = {};
  if (input.country !== undefined) row.country = input.country.toUpperCase();
  if (input.regionCode !== undefined) row.region_code = input.regionCode.toUpperCase();
  if (input.regionName !== undefined) row.region_name = input.regionName;
  if (input.taxName !== undefined) row.tax_name = input.taxName;
  if (input.rate !== undefined) row.rate = input.rate;
  if (input.appliesToShipping !== undefined) row.applies_to_shipping = input.appliesToShipping;
  if (input.enabled !== undefined) row.enabled = input.enabled;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
};

export const getTaxRates = async (): Promise<TaxRate[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('tax_rates')
    .select('*')
    .order('country')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('Error fetching tax rates:', error);
    throw error;
  }
  return (data || []).map(rowToTaxRate);
};

/** Enabled tax components for one destination region, e.g. ("CA", "BC") -> GST + PST. */
export const getRegionTaxRates = async (country: string, regionCode: string): Promise<TaxRate[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('tax_rates')
    .select('*')
    .eq('country', country)
    .eq('region_code', regionCode)
    .eq('enabled', true)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('Error fetching region tax rates:', error);
    throw error;
  }
  return (data || []).map(rowToTaxRate);
};

export const createTaxRate = async (input: TaxRateInput): Promise<TaxRate> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.from('tax_rates').insert(inputToRow(input)).select().single();
  if (error) {
    console.error('Error creating tax rate:', error);
    throw error;
  }
  return rowToTaxRate(data);
};

export const updateTaxRate = async (id: string, input: Partial<TaxRateInput>): Promise<TaxRate> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.from('tax_rates').update(inputToRow(input)).eq('id', id).select().single();
  if (error) {
    console.error('Error updating tax rate:', error);
    throw error;
  }
  return rowToTaxRate(data);
};

export const deleteTaxRate = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('tax_rates').delete().eq('id', id);
  if (error) {
    console.error('Error deleting tax rate:', error);
    throw error;
  }
};
