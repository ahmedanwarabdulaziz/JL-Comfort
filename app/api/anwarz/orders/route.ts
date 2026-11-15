import { CheckoutError } from '@/lib/checkout/errors';
import { anwarzOrder, anwarzRoute, db, rowToOrder } from '@/lib/anwarz/api';
import { OrderStatus } from '@/lib/types/order';

export const dynamic = 'force-dynamic';

const LISTED: OrderStatus[] = ['paid', 'sent_to_supplier', 'shipped', 'delivered', 'closed', 'cancelled', 'problem'];

/**
 * Paid orders, newest first (checkouts never paid are left out).
 * GET ?status=paid,sent_to_supplier (default: all paid ones) &test=1 (include test orders) &limit=100
 */
export const GET = anwarzRoute(async (request) => {
  const params = new URL(request.url).searchParams;
  const statuses = (params.get('status') || '').split(',').filter(Boolean) as OrderStatus[];
  if (statuses.some((s) => !LISTED.includes(s))) throw new CheckoutError('Unknown status.');
  const limit = Math.min(Math.max(Number(params.get('limit')) || 100, 1), 300);
  let query = db()
    .from('orders')
    .select('*, order_items(*)')
    .in('status', statuses.length ? statuses : LISTED)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (params.get('test') !== '1') query = query.eq('is_test', false);
  const { data, error } = await query;
  if (error) throw error;
  return { orders: (data || []).map((row) => anwarzOrder(rowToOrder({ ...row, order_events: [] }))) };
});
