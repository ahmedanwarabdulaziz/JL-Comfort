import { supabase } from '@/lib/supabase/client';
import { Product, ProductInput } from '@/lib/types/product';

const rowToProduct = (row: any): Product => ({
  id: row.id,
  name: row.name || '',
  description: row.description || '',
  price: row.price || 0,
  currency: row.currency || 'EGP',
  status: row.status || 'draft',
  imageUrl: row.image_url || null,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getProducts = async (): Promise<Product[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  return (data || []).map(rowToProduct);
};

export const getProduct = async (id: string): Promise<Product | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
  return data ? rowToProduct(data) : null;
};

export const createProduct = async (input: ProductInput): Promise<Product> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      status: input.status,
      image_url: input.imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }
  return rowToProduct(data);
};

export const updateProduct = async (
  id: string,
  input: Partial<ProductInput>
): Promise<Product> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.price !== undefined) patch.price = input.price;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.status !== undefined) patch.status = input.status;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;

  const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single();
  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }
  return rowToProduct(data);
};

export const deleteProduct = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
