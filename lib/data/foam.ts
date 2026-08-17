import { supabase } from '@/lib/supabase/client';
import { FoamType, FoamTypeInput } from '@/lib/types/foam';

const rowToFoamType = (row: any): FoamType => {
  const normalizedDimensions = (row.dimensions || []).map((dim: any) => ({
    ...dim,
    type: dim.type === 'length' ? 'depth' : dim.type,
  }));

  return {
    id: row.id,
    categoryId: row.category_id || '',
    name: row.name || '',
    description: row.description || '',
    imageUrl: row.image_url || null,
    svgId: row.svg_id || '',
    customSvgContent: row.custom_svg_content || '',
    dimensions: normalizedDimensions,
    sortOrder: row.sort_order ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

export const getFoamTypes = async (categoryId?: string): Promise<FoamType[]> => {
  if (!supabase) return [];

  let query = supabase.from('foam').select('*').order('sort_order', { ascending: true });
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching foam types:', error);
    throw error;
  }
  return (data || []).map(rowToFoamType);
};

export const getFoamType = async (id: string): Promise<FoamType | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase.from('foam').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('Error fetching foam type:', error);
    throw error;
  }
  return data ? rowToFoamType(data) : null;
};

// This function is deprecated - use getCategories from categories.ts instead
// Keeping for backward compatibility
export const getFoamCategories = async (): Promise<string[]> => {
  const { getCategories } = await import('./categories');
  const categories = await getCategories();
  return categories.map((c) => c.name);
};

export const createFoamType = async (input: FoamTypeInput): Promise<FoamType> => {
  if (!supabase) throw new Error('Supabase not configured');

  const existingTypes = await getFoamTypes(input.categoryId);
  const maxSortOrder =
    existingTypes.length > 0 ? Math.max(...existingTypes.map((t) => t.sortOrder || 0)) : -1;

  const { data, error } = await supabase
    .from('foam')
    .insert({
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      image_url: input.imageUrl,
      svg_id: input.svgId,
      custom_svg_content: input.customSvgContent,
      dimensions: input.dimensions,
      sort_order: input.sortOrder ?? maxSortOrder + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating foam type:', error);
    throw error;
  }
  return rowToFoamType(data);
};

export const updateFoamType = async (
  id: string,
  input: Partial<FoamTypeInput>
): Promise<FoamType> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  if (input.svgId !== undefined) patch.svg_id = input.svgId;
  if (input.customSvgContent !== undefined) patch.custom_svg_content = input.customSvgContent;
  if (input.dimensions !== undefined) patch.dimensions = input.dimensions;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase.from('foam').update(patch).eq('id', id).select().single();
  if (error) {
    console.error('Error updating foam type:', error);
    throw error;
  }
  return rowToFoamType(data);
};

export const deleteFoamType = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('foam').delete().eq('id', id);
  if (error) {
    console.error('Error deleting foam type:', error);
    throw error;
  }
};
