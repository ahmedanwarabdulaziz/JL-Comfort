import { supabase } from '@/lib/supabase/client';
import { FabricPriceRange, FabricPriceRangeInput } from '@/lib/types/fabricPriceRange';

export { resolvePriceRange } from '@/lib/types/fabricPriceRange';

const rowToFabricPriceRange = (row: any): FabricPriceRange => ({
  id: row.id,
  name: row.name || '',
  minPrice: row.min_price ?? 0,
  maxPrice: row.max_price ?? null,
  sortOrder: row.sort_order ?? 0,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getFabricPriceRanges = async (): Promise<FabricPriceRange[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fabric_price_ranges')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching fabric price ranges:', error);
    throw error;
  }
  return (data || []).map(rowToFabricPriceRange);
};

export const createFabricPriceRange = async (
  input: FabricPriceRangeInput
): Promise<FabricPriceRange> => {
  if (!supabase) throw new Error('Supabase not configured');

  const existing = await getFabricPriceRanges();
  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((r) => r.sortOrder || 0)) : -1;

  const { data, error } = await supabase
    .from('fabric_price_ranges')
    .insert({
      name: input.name,
      min_price: input.minPrice,
      max_price: input.maxPrice,
      sort_order: input.sortOrder ?? maxSortOrder + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating fabric price range:', error);
    throw error;
  }
  return rowToFabricPriceRange(data);
};

export const updateFabricPriceRange = async (
  id: string,
  input: Partial<FabricPriceRangeInput>
): Promise<FabricPriceRange> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.minPrice !== undefined) patch.min_price = input.minPrice;
  if (input.maxPrice !== undefined) patch.max_price = input.maxPrice;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('fabric_price_ranges')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating fabric price range:', error);
    throw error;
  }
  return rowToFabricPriceRange(data);
};

export const deleteFabricPriceRange = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('fabric_price_ranges').delete().eq('id', id);
  if (error) {
    console.error('Error deleting fabric price range:', error);
    throw error;
  }
};
