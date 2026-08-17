import { supabase } from '@/lib/supabase/client';
import { FabricPriceTier, FabricPriceTierInput } from '@/lib/types/fabricPriceTier';

const SELECT = '*, fabric_price_tier_materials(material_slug)';

const rowToFabricPriceTier = (row: any): FabricPriceTier => ({
  id: row.id,
  name: row.name || '',
  pricePerYard: row.price_per_yard ?? 0,
  materials: (row.fabric_price_tier_materials || []).map((m: any) => m.material_slug),
  isDefault: row.is_default ?? false,
  sortOrder: row.sort_order ?? 0,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getFabricPriceTiers = async (): Promise<FabricPriceTier[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fabric_price_tiers')
    .select(SELECT)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching fabric price tiers:', error);
    throw error;
  }
  return (data || []).map(rowToFabricPriceTier);
};

export const createFabricPriceTier = async (
  input: FabricPriceTierInput
): Promise<FabricPriceTier> => {
  if (!supabase) throw new Error('Supabase not configured');

  const existing = await getFabricPriceTiers();
  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((t) => t.sortOrder || 0)) : -1;

  const { data: tierRow, error } = await supabase
    .from('fabric_price_tiers')
    .insert({
      name: input.name,
      price_per_yard: input.pricePerYard,
      is_default: input.isDefault ?? false,
      sort_order: input.sortOrder ?? maxSortOrder + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating fabric price tier:', error);
    throw error;
  }

  if (input.materials.length > 0) {
    const { error: materialsError } = await supabase
      .from('fabric_price_tier_materials')
      .insert(input.materials.map((slug) => ({ tier_id: tierRow.id, material_slug: slug })));

    if (materialsError) {
      console.error('Error creating fabric price tier materials:', materialsError);
      throw materialsError;
    }
  }

  return rowToFabricPriceTier({ ...tierRow, fabric_price_tier_materials: input.materials.map((slug) => ({ material_slug: slug })) });
};

export const updateFabricPriceTier = async (
  id: string,
  input: Partial<FabricPriceTierInput>
): Promise<FabricPriceTier> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.pricePerYard !== undefined) patch.price_per_yard = input.pricePerYard;
  if (input.isDefault !== undefined) patch.is_default = input.isDefault;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('fabric_price_tiers').update(patch).eq('id', id);
    if (error) {
      console.error('Error updating fabric price tier:', error);
      throw error;
    }
  }

  if (input.materials !== undefined) {
    const { error: deleteError } = await supabase
      .from('fabric_price_tier_materials')
      .delete()
      .eq('tier_id', id);
    if (deleteError) {
      console.error('Error clearing fabric price tier materials:', deleteError);
      throw deleteError;
    }

    if (input.materials.length > 0) {
      const { error: insertError } = await supabase
        .from('fabric_price_tier_materials')
        .insert(input.materials.map((slug) => ({ tier_id: id, material_slug: slug })));
      if (insertError) {
        console.error('Error inserting fabric price tier materials:', insertError);
        throw insertError;
      }
    }
  }

  const { data, error } = await supabase.from('fabric_price_tiers').select(SELECT).eq('id', id).single();
  if (error) {
    console.error('Error fetching updated fabric price tier:', error);
    throw error;
  }
  return rowToFabricPriceTier(data);
};

export const deleteFabricPriceTier = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('fabric_price_tiers').delete().eq('id', id);
  if (error) {
    console.error('Error deleting fabric price tier:', error);
    throw error;
  }
};
