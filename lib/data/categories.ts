import { supabase } from '@/lib/supabase/client';
import { Category, CategoryInput } from '@/lib/types/category';

const rowToCategory = (row: any): Category => ({
  id: row.id,
  name: row.name || '',
  description: row.description || '',
  sortOrder: row.sort_order ?? 0,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getCategories = async (): Promise<Category[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
  return (data || []).map(rowToCategory);
};

export const getCategory = async (id: string): Promise<Category | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();

  if (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
  return data ? rowToCategory(data) : null;
};

export const createCategory = async (input: CategoryInput): Promise<Category> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      description: input.description,
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }
  return rowToCategory(data);
};

export const updateCategory = async (
  id: string,
  input: Partial<CategoryInput>
): Promise<Category> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }
  return rowToCategory(data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const updateCategoriesOrder = async (categories: Category[]): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  for (const cat of categories) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: cat.sortOrder })
      .eq('id', cat.id);

    if (error) {
      console.error('Error updating categories order:', error);
      throw error;
    }
  }
};
