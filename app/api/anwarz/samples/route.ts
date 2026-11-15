import { CheckoutError } from '@/lib/checkout/errors';
import { anwarzRoute, anwarzSample, db, rowToSampleRequest } from '@/lib/anwarz/api';
import { SampleRequestStatus } from '@/lib/types/sampleRequest';

export const dynamic = 'force-dynamic';

const LISTED: SampleRequestStatus[] = ['pending', 'sent_to_supplier', 'shipped', 'delivered', 'cancelled', 'problem'];

/** Sample requests, newest first. GET ?status=pending,sent_to_supplier &limit=100 */
export const GET = anwarzRoute(async (request) => {
  const params = new URL(request.url).searchParams;
  const statuses = (params.get('status') || '').split(',').filter(Boolean) as SampleRequestStatus[];
  if (statuses.some((s) => !LISTED.includes(s))) throw new CheckoutError('Unknown status.');
  const limit = Math.min(Math.max(Number(params.get('limit')) || 100, 1), 300);
  const { data, error } = await db()
    .from('sample_requests')
    .select('*, sample_request_items(*), sample_request_events(id, type, created_at)')
    .in('status', statuses.length ? statuses : LISTED)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return { samples: (data || []).map((row) => anwarzSample(rowToSampleRequest({ ...row, sample_request_events: (row.sample_request_events || []).filter((e: { type: string }) => e.type === 'supplier_confirmed') }))) };
});
