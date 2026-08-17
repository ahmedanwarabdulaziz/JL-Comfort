import { supabase } from '@/lib/supabase/client';
import { BenchCushionStyle, BenchCushionStyleInput } from '@/lib/types/benchCushion';

const SELECT = '*, bench_cushion_variables(*, bench_cushion_variable_options(*))';

const rowToBenchCushionStyle = (row: any): BenchCushionStyle => {
  const variables = (row.bench_cushion_variables || [])
    .slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((v: any) => ({
      name: v.name || '',
      options: (v.bench_cushion_variable_options || [])
        .slice()
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((o: any) => ({
          label: o.label || '',
          priceModifier: o.price_modifier ?? 0,
          imageUrl: o.image_url ?? null,
        })),
    }));

  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    images: row.images || [],
    dimensions: row.dimensions || [],
    variables,
    basePrice: row.base_price ?? 0,
    currency: row.currency || 'usd',
    estimatedYards: row.estimated_yards ?? 0,
    sortOrder: row.sort_order ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

const toRpcVariables = (variables: BenchCushionStyleInput['variables']) =>
  variables.map((v, vi) => ({
    name: v.name,
    sort_order: vi,
    options: v.options.map((o, oi) => ({
      label: o.label,
      price_modifier: o.priceModifier,
      image_url: o.imageUrl,
      sort_order: oi,
    })),
  }));

export const getBenchCushionStyles = async (): Promise<BenchCushionStyle[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('bench_cushions')
    .select(SELECT)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching bench cushion styles:', error);
    throw error;
  }
  return (data || []).map(rowToBenchCushionStyle);
};

export const getBenchCushionStyle = async (id: string): Promise<BenchCushionStyle | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase.from('bench_cushions').select(SELECT).eq('id', id).maybeSingle();
  if (error) {
    console.error('Error fetching bench cushion style:', error);
    throw error;
  }
  return data ? rowToBenchCushionStyle(data) : null;
};

export const createBenchCushionStyle = async (
  input: BenchCushionStyleInput
): Promise<BenchCushionStyle> => {
  if (!supabase) throw new Error('Supabase not configured');

  const existing = await getBenchCushionStyles();
  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((s) => s.sortOrder || 0)) : -1;

  const { data: newId, error } = await supabase.rpc('upsert_bench_cushion_style', {
    style: {
      name: input.name,
      description: input.description,
      images: input.images,
      dimensions: input.dimensions,
      base_price: input.basePrice,
      currency: input.currency,
      estimated_yards: input.estimatedYards,
      sort_order: input.sortOrder ?? maxSortOrder + 1,
      variables: toRpcVariables(input.variables),
    },
  });

  if (error) {
    console.error('Error creating bench cushion style:', error);
    throw error;
  }

  const created = await getBenchCushionStyle(newId as unknown as string);
  if (!created) throw new Error('Failed to load created bench cushion style');
  return created;
};

export const updateBenchCushionStyle = async (
  id: string,
  input: Partial<BenchCushionStyleInput>
): Promise<BenchCushionStyle> => {
  if (!supabase) throw new Error('Supabase not configured');

  const current = await getBenchCushionStyle(id);
  if (!current) throw new Error('Bench cushion style not found');

  const merged: BenchCushionStyleInput = {
    name: input.name ?? current.name,
    description: input.description ?? current.description,
    images: input.images ?? current.images,
    dimensions: input.dimensions ?? current.dimensions,
    variables: input.variables ?? current.variables,
    basePrice: input.basePrice ?? current.basePrice,
    currency: input.currency ?? current.currency,
    estimatedYards: input.estimatedYards ?? current.estimatedYards,
    sortOrder: input.sortOrder ?? current.sortOrder,
  };

  const { error } = await supabase.rpc('upsert_bench_cushion_style', {
    style: {
      id,
      name: merged.name,
      description: merged.description,
      images: merged.images,
      dimensions: merged.dimensions,
      base_price: merged.basePrice,
      currency: merged.currency,
      estimated_yards: merged.estimatedYards,
      sort_order: merged.sortOrder ?? 0,
      variables: toRpcVariables(merged.variables),
    },
  });

  if (error) {
    console.error('Error updating bench cushion style:', error);
    throw error;
  }

  const updated = await getBenchCushionStyle(id);
  if (!updated) throw new Error('Failed to load updated bench cushion style');
  return updated;
};

export const deleteBenchCushionStyle = async (id: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('bench_cushions').delete().eq('id', id);
  if (error) {
    console.error('Error deleting bench cushion style:', error);
    throw error;
  }
};
