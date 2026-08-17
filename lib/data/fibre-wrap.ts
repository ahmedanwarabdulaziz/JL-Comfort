import { supabase } from '@/lib/supabase/client';
import { FibreWrap, FibreWrapInput } from '@/lib/types/fibre-wrap';

const rowToFibreWrap = (row: any): FibreWrap => ({
  id: row.id,
  fibreThickness: row.fibre_thickness || '',
  value: row.value ?? 0,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const getFibreWraps = async (): Promise<FibreWrap[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fibre_wrap')
    .select('*')
    .order('fibre_thickness', { ascending: true });

  if (error) {
    console.error('Error fetching fibre wraps:', error);
    throw error;
  }
  return (data || []).map(rowToFibreWrap);
};

export const getFibreWrap = async (id: string): Promise<FibreWrap | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase.from('fibre_wrap').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('Error fetching fibre wrap:', error);
    throw error;
  }
  return data ? rowToFibreWrap(data) : null;
};

export const createFibreWrap = async (input: FibreWrapInput): Promise<FibreWrap> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('fibre_wrap')
    .insert({ fibre_thickness: input.fibreThickness, value: input.value })
    .select()
    .single();

  if (error) {
    console.error('Error creating fibre wrap:', error);
    throw error;
  }
  return rowToFibreWrap(data);
};

export const updateFibreWrap = async (
  id: string,
  input: Partial<FibreWrapInput>
): Promise<FibreWrap> => {
  if (!supabase) throw new Error('Supabase not configured');

  const patch: Record<string, unknown> = {};
  if (input.fibreThickness !== undefined) patch.fibre_thickness = input.fibreThickness;
  if (input.value !== undefined) patch.value = input.value;

  const { data, error } = await supabase
    .from('fibre_wrap')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating fibre wrap:', error);
    throw error;
  }
  return rowToFibreWrap(data);
};

export const deleteFibreWrap = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('fibre_wrap').delete().eq('id', id);
  if (error) {
    console.error('Error deleting fibre wrap:', error);
    throw error;
  }
};
