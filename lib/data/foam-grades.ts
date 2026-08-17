import { supabase } from '@/lib/supabase/client';
import { FoamGrade, FoamGradeInput } from '@/lib/types/foam-grade';

const rowToFoamGrade = (row: any): FoamGrade => ({
  id: row.id,
  brand: row.brand || '',
  gradeName: row.grade_name || '',
  price: row.price ?? 0,
  density: row.density || '',
  firmness: row.firmness || '',
  warranty: row.warranty || '',
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getFoamGrades = async (brand?: string): Promise<FoamGrade[]> => {
  if (!supabase) return [];

  let query = supabase.from('foam_grades').select('*');
  query = brand
    ? query.eq('brand', brand).order('grade_name', { ascending: true })
    : query.order('brand', { ascending: true }).order('grade_name', { ascending: true });

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching foam grades:', error);
    throw error;
  }
  return (data || []).map(rowToFoamGrade);
};

export const getFoamGrade = async (id: string): Promise<FoamGrade | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase.from('foam_grades').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('Error fetching foam grade:', error);
    throw error;
  }
  return data ? rowToFoamGrade(data) : null;
};

export const getFoamGradeBrands = async (): Promise<string[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase.from('foam_grades').select('brand').order('brand', { ascending: true });
  if (error) {
    console.error('Error fetching foam grade brands:', error);
    throw error;
  }
  return Array.from(new Set((data || []).map((row: any) => row.brand).filter(Boolean))).sort();
};

export const createFoamGrade = async (input: FoamGradeInput): Promise<FoamGrade> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('foam_grades')
    .insert({
      brand: input.brand,
      grade_name: input.gradeName,
      price: input.price,
      density: input.density,
      firmness: input.firmness,
      warranty: input.warranty,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating foam grade:', error);
    throw error;
  }
  return rowToFoamGrade(data);
};

export const updateFoamGrade = async (
  id: string,
  input: Partial<FoamGradeInput>
): Promise<FoamGrade> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.brand !== undefined) patch.brand = input.brand;
  if (input.gradeName !== undefined) patch.grade_name = input.gradeName;
  if (input.price !== undefined) patch.price = input.price;
  if (input.density !== undefined) patch.density = input.density;
  if (input.firmness !== undefined) patch.firmness = input.firmness;
  if (input.warranty !== undefined) patch.warranty = input.warranty;

  const { data, error } = await supabase
    .from('foam_grades')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating foam grade:', error);
    throw error;
  }
  return rowToFoamGrade(data);
};

export const deleteFoamGrade = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('foam_grades').delete().eq('id', id);
  if (error) {
    console.error('Error deleting foam grade:', error);
    throw error;
  }
};
