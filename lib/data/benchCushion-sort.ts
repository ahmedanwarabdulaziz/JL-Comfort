import { supabase } from '@/lib/supabase/client';
import { BenchCushionStyle } from '@/lib/types/benchCushion';

/**
 * Update the sort order of multiple bench cushion styles
 */
export const updateBenchCushionStylesOrder = async (styles: BenchCushionStyle[]): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  for (let index = 0; index < styles.length; index++) {
    const { error } = await supabase
      .from('bench_cushions')
      .update({ sort_order: index })
      .eq('id', styles[index].id);

    if (error) {
      console.error('Error updating bench cushion styles order:', error);
      throw error;
    }
  }
};
