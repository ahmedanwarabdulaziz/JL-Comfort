import { supabase } from '@/lib/supabase/client';
import {
  DEFAULT_SAMPLE_SETTINGS,
  SampleRequest,
  SampleRequestStatus,
  SampleSettings,
  rowToSampleRequest,
  rowToSampleSettings,
} from '@/lib/types/sampleRequest';

// Admin-side reads through the signed-in admin's session (RLS: admin_users only). Creation happens
// server-side in /api/fabric-samples/request; actions that send email go through
// /api/admin/sample-requests/[id].

export const getSampleRequests = async (statuses?: SampleRequestStatus[]): Promise<SampleRequest[]> => {
  if (!supabase) return [];

  let query = supabase
    .from('sample_requests')
    .select('*, sample_request_items(*)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (statuses && statuses.length > 0) query = query.in('status', statuses);
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching sample requests:', error);
    throw error;
  }
  return (data || []).map(rowToSampleRequest);
};

export const getSampleRequestWithHistory = async (id: string): Promise<SampleRequest | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('sample_requests')
    .select('*, sample_request_items(*), sample_request_events(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSampleRequest(data) : null;
};

export const runSampleRequestAction = async (id: string, body: Record<string, unknown>): Promise<{ ok: boolean }> => {
  const response = await fetch(`/api/admin/sample-requests/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Action failed');
  return { ok: data.ok };
};

/** Public: the storefront reads the limits to cap the sample cart. */
export const getSampleSettings = async (): Promise<SampleSettings> => {
  if (!supabase) return DEFAULT_SAMPLE_SETTINGS;
  const { data, error } = await supabase.from('sample_settings').select('*').eq('id', true).maybeSingle();
  if (error) {
    console.error('Error fetching sample settings:', error);
    return DEFAULT_SAMPLE_SETTINGS;
  }
  return rowToSampleSettings(data);
};

export const saveSampleSettings = async (settings: SampleSettings): Promise<SampleSettings> => {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('sample_settings')
    .upsert({
      id: true,
      requests_enabled: settings.requestsEnabled,
      max_per_request: settings.maxPerRequest,
      max_per_customer: settings.maxPerCustomer,
      period_days: settings.periodDays,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToSampleSettings(data);
};
