import { supabase } from '@/lib/supabase/client';
import { SampleRequest, SampleRequestItem } from '@/lib/types/sampleRequest';

const rowToSampleRequest = (row: any): SampleRequest => ({
  id: row.id,
  items: ((row.sample_request_items || []) as any[])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(
      (item): SampleRequestItem => ({
        fabricId: item.fabric_id || '',
        name: item.name || '',
        sku: item.sku || '',
        imageUrl: item.image_url || '',
      })
    ),
  name: row.name || '',
  email: row.email || '',
  phone: row.phone || undefined,
  address: {
    line1: row.address_line1 || '',
    line2: row.address_line2 || undefined,
    city: row.address_city || '',
    state: row.address_state || '',
    zip: row.address_zip || '',
    country: row.address_country || '',
  },
  status: row.status || 'pending',
  createdAt: new Date(row.created_at),
});

/** Reads every sample request — creation only happens server-side via /api/fabric-samples/request. */
export const getSampleRequests = async (): Promise<SampleRequest[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('sample_requests')
    .select('*, sample_request_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sample requests:', error);
    throw error;
  }
  return (data || []).map(rowToSampleRequest);
};

export const markSampleRequestShipped = async (id: string): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase.from('sample_requests').update({ status: 'shipped' }).eq('id', id);
  if (error) {
    console.error('Error marking sample request shipped:', error);
    throw error;
  }
};
