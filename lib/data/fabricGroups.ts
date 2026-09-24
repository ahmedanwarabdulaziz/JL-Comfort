import { supabase } from '@/lib/supabase/client';
import { FabricGroup, FabricGroupInput, FabricGroupMember, FabricSearchResult } from '@/lib/types/fabricGroup';

const rowToFabricGroup = (row: any): FabricGroup => ({
  id: row.id,
  name: row.name || '',
  description: row.description || '',
  sortOrder: row.sort_order ?? 0,
  showOnHomepage: row.show_on_homepage ?? false,
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
      show_on_homepage: input.showOnHomepage ?? false,
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
  if (input.showOnHomepage !== undefined) patch.show_on_homepage = input.showOnHomepage;

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

// --- group membership --------------------------------------------------------------------------
// This is one of two ways to add fabrics to a group: search-and-add here on the group itself, or
// bulk-select rows on the Fabric Catalog Sync page (bulkAddToGroup in charlotteFabricCatalog.ts).

const MEMBER_SELECT = 'fabric_id, is_featured, charlotte_fabrics(id, name, sku, image_url, status)';

export const getGroupMembers = async (groupId: string): Promise<FabricGroupMember[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase.from('fabric_group_members').select(MEMBER_SELECT).eq('group_id', groupId);
  if (error) {
    console.error('Error fetching group members:', error);
    throw error;
  }
  return (data || [])
    .filter((row: any) => row.charlotte_fabrics && row.charlotte_fabrics.status === 'active')
    .map((row: any) => ({
      fabricId: row.fabric_id,
      name: row.charlotte_fabrics.name || '',
      sku: row.charlotte_fabrics.sku || '',
      imageUrl: row.charlotte_fabrics.image_url || '',
      isFeatured: !!row.is_featured,
    }))
    .sort((a: FabricGroupMember, b: FabricGroupMember) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name));
};

/** Fabrics matching a name/SKU search, for the "add to group" search box. Excludes current members. */
export const searchFabricsToAdd = async (query: string, excludeIds: string[], limit = 20): Promise<FabricSearchResult[]> => {
  if (!supabase || !query.trim()) return [];

  let request = supabase
    .from('charlotte_fabrics')
    .select('id, name, sku, image_url')
    .eq('status', 'active')
    .or(`name.ilike.%${query.trim()}%,sku.ilike.%${query.trim()}%`)
    .order('name')
    .limit(limit + excludeIds.length);
  const { data, error } = await request;
  if (error) {
    console.error('Error searching fabrics:', error);
    throw error;
  }
  const exclude = new Set(excludeIds);
  return (data || [])
    .filter((row: any) => !exclude.has(row.id))
    .slice(0, limit)
    .map((row: any) => ({ id: row.id, name: row.name || '', sku: row.sku || '', imageUrl: row.image_url || '' }));
};

export const addFabricToGroup = async (groupId: string, fabricId: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('fabric_group_members')
    .upsert({ fabric_id: fabricId, group_id: groupId }, { onConflict: 'fabric_id,group_id', ignoreDuplicates: true });
  if (error) {
    console.error('Error adding fabric to group:', error);
    throw error;
  }
};

export const removeFabricFromGroup = async (groupId: string, fabricId: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('fabric_group_members').delete().eq('group_id', groupId).eq('fabric_id', fabricId);
  if (error) {
    console.error('Error removing fabric from group:', error);
    throw error;
  }
};

/** Marks (or unmarks) a member as featured -- shown as a cover photo when the group appears on the homepage. */
export const setGroupMemberFeatured = async (groupId: string, fabricId: string, featured: boolean): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('fabric_group_members')
    .update({ is_featured: featured })
    .eq('group_id', groupId)
    .eq('fabric_id', fabricId);
  if (error) {
    console.error('Error updating featured fabric:', error);
    throw error;
  }
};
