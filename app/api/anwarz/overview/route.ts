import { ANWARZ_META, anwarzRoute, db } from '@/lib/anwarz/api';

export const dynamic = 'force-dynamic';

/** Counts per status (real orders and test orders apart), plus carriers and status names. */
export const GET = anwarzRoute(async () => {
  const [orders, samples] = await Promise.all([
    db().from('orders').select('status, is_test').not('status', 'in', '(pending_payment,expired)').limit(5000),
    db().from('sample_requests').select('status').limit(5000),
  ]);
  if (orders.error) throw orders.error;
  if (samples.error) throw samples.error;
  const orderCounts: Record<string, number> = {};
  let testOrders = 0;
  for (const o of orders.data || []) {
    if (o.is_test) testOrders++;
    else orderCounts[o.status] = (orderCounts[o.status] || 0) + 1;
  }
  const sampleCounts: Record<string, number> = {};
  for (const s of samples.data || []) sampleCounts[s.status] = (sampleCounts[s.status] || 0) + 1;
  return { orders: orderCounts, testOrders, samples: sampleCounts, ...ANWARZ_META };
});
