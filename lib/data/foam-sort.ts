import { supabase } from '@/lib/supabase/client';
import { FoamType } from '@/lib/types/foam';

/**
 * Update the sort order of multiple foam types
 */
export const updateFoamTypesOrder = async (foamTypes: FoamType[]): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');

  for (let index = 0; index < foamTypes.length; index++) {
    const { error } = await supabase
      .from('foam')
      .update({ sort_order: index })
      .eq('id', foamTypes[index].id);

    if (error) {
      console.error('Error updating foam types order:', error);
      throw error;
    }
  }
};
