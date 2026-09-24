import { supabase } from '@/lib/supabase/client';
import { ShippingRate, ShippingRateInput } from '@/lib/types/checkout';

const rowToShippingRate = (row: any): ShippingRate => ({
  country: row.country,
  enabled: row.enabled ?? true,
  fabricOrderFee: Number(row.fabric_order_fee ?? 0),
  fabricPerYard: Number(row.fabric_per_yard ?? 0),
  vinylPerYard: Number(row.vinyl_per_yard ?? 0),
  foamPerItem: Number(row.foam_per_item ?? 0),
  benchCushionPerItem: Number(row.bench_cushion_per_item ?? 0),
  freeShippingOver: row.free_shipping_over === null || row.free_shipping_over === undefined ? null : Number(row.free_shipping_over),
  deliveryMinDays: row.delivery_min_days ?? 3,
  deliveryMaxDays: row.delivery_max_days ?? 7,
  updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
});

export const getShippingRates = async (): Promise<ShippingRate[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase.from('shipping_rates').select('*').order('country');
  if (error) {
    console.error('Error fetching shipping rates:', error);
    throw error;
  }
  return (data || []).map(rowToShippingRate);
};

export const getShippingRate = async (country: string): Promise<ShippingRate | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase.from('shipping_rates').select('*').eq('country', country).maybeSingle();
  if (error) {
    console.error('Error fetching shipping rate:', error);
    throw error;
  }
  return data ? rowToShippingRate(data) : null;
};

export const saveShippingRate = async (input: ShippingRateInput): Promise<ShippingRate> => {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('shipping_rates')
    .upsert({
      country: input.country,
      enabled: input.enabled,
      fabric_order_fee: input.fabricOrderFee,
      fabric_per_yard: input.fabricPerYard,
      vinyl_per_yard: input.vinylPerYard,
      foam_per_item: input.foamPerItem,
      bench_cushion_per_item: input.benchCushionPerItem,
      free_shipping_over: input.freeShippingOver,
      delivery_min_days: input.deliveryMinDays,
      delivery_max_days: input.deliveryMaxDays,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving shipping rate:', error);
    throw error;
  }
  return rowToShippingRate(data);
};
