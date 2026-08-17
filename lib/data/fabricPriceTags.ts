import { supabase } from '@/lib/supabase/client';
import { FabricPriceTag, FabricPriceTagInput } from '@/lib/types/fabricPriceTag';

const rowToFabricPriceTag = (row: any): FabricPriceTag => ({
  id: row.id,
  name: row.name || '',
  pricePerYard: row.price_per_yard ?? 0,
  sortOrder: row.sort_order ?? 0,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getFabricPriceTags = async (): Promise<FabricPriceTag[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fabric_price_tags')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching fabric price tags:', error);
    throw error;
  }
  return (data || []).map(rowToFabricPriceTag);
};

export const createFabricPriceTag = async (input: FabricPriceTagInput): Promise<FabricPriceTag> => {
  if (!supabase) throw new Error('Supabase not configured');

  const existing = await getFabricPriceTags();
  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((t) => t.sortOrder || 0)) : -1;

  const { data, error } = await supabase
    .from('fabric_price_tags')
    .insert({
      name: input.name,
      price_per_yard: input.pricePerYard,
      sort_order: input.sortOrder ?? maxSortOrder + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating fabric price tag:', error);
    throw error;
  }
  return rowToFabricPriceTag(data);
};

export const updateFabricPriceTag = async (
  id: string,
  input: Partial<FabricPriceTagInput>
): Promise<FabricPriceTag> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.pricePerYard !== undefined) patch.price_per_yard = input.pricePerYard;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('fabric_price_tags')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating fabric price tag:', error);
    throw error;
  }
  return rowToFabricPriceTag(data);
};

export const deleteFabricPriceTag = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('fabric_price_tags').delete().eq('id', id);
  if (error) {
    console.error('Error deleting fabric price tag:', error);
    throw error;
  }
};
