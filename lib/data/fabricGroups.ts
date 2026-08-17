import { supabase } from '@/lib/supabase/client';
import { FabricGroup, FabricGroupInput } from '@/lib/types/fabricGroup';

const rowToFabricGroup = (row: any): FabricGroup => ({
  id: row.id,
  name: row.name || '',
  description: row.description || '',
  sortOrder: row.sort_order ?? 0,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getFabricGroups = async (): Promise<FabricGroup[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fabric_groups')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching fabric groups:', error);
    throw error;
  }
  return (data || []).map(rowToFabricGroup);
};

export const createFabricGroup = async (input: FabricGroupInput): Promise<FabricGroup> => {
  if (!supabase) throw new Error('Supabase not configured');

  const existing = await getFabricGroups();
  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((g) => g.sortOrder || 0)) : -1;

  const { data, error } = await supabase
    .from('fabric_groups')
    .insert({
      name: input.name,
      description: input.description,
      sort_order: input.sortOrder ?? maxSortOrder + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating fabric group:', error);
    throw error;
  }
  return rowToFabricGroup(data);
};

export const updateFabricGroup = async (
  id: string,
  input: Partial<FabricGroupInput>
): Promise<FabricGroup> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('fabric_groups')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating fabric group:', error);
    throw error;
  }
  return rowToFabricGroup(data);
};

export const deleteFabricGroup = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('fabric_groups').delete().eq('id', id);
  if (error) {
    console.error('Error deleting fabric group:', error);
    throw error;
  }
};
