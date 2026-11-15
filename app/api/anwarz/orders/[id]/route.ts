import { CheckoutError } from '@/lib/checkout/errors';
import { anwarzOrder, anwarzRoute, samplesBeforeOrders } from '@/lib/anwarz/api';
import { runOrderAction } from '@/lib/orders/actions';
import { getOrder } from '@/lib/orders/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Ctx = { params: { id: string } };

async function load(id: string) {
  const order = await getOrder(id);
  if (!order) throw new CheckoutError('Order not found', 404);
  return order;
}

/** One order with its items and history (emails sent or failed, status changes, tracking). */
export const GET = anwarzRoute<Ctx>(async (_request, { params }) => {
  const order = await load(params.id);
  return { order: anwarzOrder(order, true, (await samplesBeforeOrders([order])).get(order.id)) };
});

/** Same actions as the admin panel (lib/orders/actions.ts): ship, set_supplier_refs, resend_*, set_status. */
export const POST = anwarzRoute<Ctx>(async (request, { params }) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') throw new CheckoutError('Expected a JSON body.');
  const ok = await runOrderAction(await load(params.id), body);
  const order = await load(params.id);
  return { ok, order: anwarzOrder(order, true, (await samplesBeforeOrders([order])).get(order.id)) };
});
