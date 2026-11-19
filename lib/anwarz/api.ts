import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { CheckoutError } from '@/lib/checkout/errors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CARRIERS, Order, ORDER_STATUS_LABELS, rowToOrder } from '@/lib/types/order';
import {
  CHANNEL_LABELS,
  CUSTOMER_PATH_LABELS,
  SampleBefore,
  SampleForMatching,
  channelOf,
  creditedTouch,
  customerPath,
  matchSamplesBefore,
} from '@/lib/orders/customerSource';
import { SAMPLE_STATUS_LABELS, SampleRequest, rowToSampleRequest } from '@/lib/types/sampleRequest';

// The Anwarz app (North Via Marketing's control center) manages JL Comfort orders and sample requests
// through /api/anwarz/*. Only the Anwarz server calls it, with `Authorization: Bearer <ANWARZ_API_KEY>`
// (a long random secret set in both projects). These routes are outside middleware.ts, so this check
// is their only gate. The actions are the same functions the admin panel uses.

function safeEqual(a: string, b: string) {
  const left = crypto.createHash('sha256').update(a).digest();
  const right = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

export function isAnwarzRequest(request: Request) {
  const secret = process.env.ANWARZ_API_KEY?.trim();
  if (!secret || secret.length < 32) return false;
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return Boolean(token) && safeEqual(token, secret);
}

/** Wraps a handler: checks the key, returns JSON, turns errors into { error } with a status. */
export function anwarzRoute<C>(handler: (request: Request, context: C) => Promise<unknown>) {
  return async (request: Request, context: C) => {
    if (!isAnwarzRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
      const result = await handler(request, context);
      return result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
    } catch (error: any) {
      if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
      console.error('Anwarz API failed:', request.method, new URL(request.url).pathname, error);
      return NextResponse.json({ error: error?.message || 'Action failed' }, { status: 500 });
    }
  };
}

export function db() {
  if (!supabaseAdmin) throw new CheckoutError('Orders are not configured (SUPABASE_SERVICE_ROLE_KEY missing).', 503);
  return supabaseAdmin;
}

export type { SampleBefore };

/**
 * For each order: the sample requests the same customer made before ordering, so the app can show
 * "came from samples" (matching rules in lib/orders/customerSource.ts). There are few sample
 * requests, so they are matched here rather than in SQL.
 */
export async function samplesBeforeOrders(orders: Order[]): Promise<Map<string, SampleBefore[]>> {
  const result = new Map<string, SampleBefore[]>();
  if (!orders.length) return result;
  const { data, error } = await db().from('sample_requests').select('request_number, name, email, phone, address_zip, created_at').order('created_at').limit(5000);
  if (error) throw error;
  for (const order of orders) result.set(order.id, matchSamplesBefore(order, (data || []) as SampleForMatching[]));
  return result;
}

/** What the app needs from an order: no payment ids, ad tracking or marketing data. */
export function anwarzOrder(order: Order, full = false, samplesBefore: SampleBefore[] = []) {
  const { stripeCheckoutSessionId, stripePaymentIntentId, attribution, adSignals, events, items, ...rest } = order;
  void stripeCheckoutSessionId;
  void stripePaymentIntentId;
  void adSignals;
  return {
    ...rest,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    items,
    samplesBefore,
    // Path to the order (samples / email enquiry / direct) and the visit channel, as plain labels.
    customerPath: CUSTOMER_PATH_LABELS[customerPath(samplesBefore, order.emailEnquiry)],
    channel: CHANNEL_LABELS[channelOf(creditedTouch(attribution))],
    ...(full ? { events: [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) } : {}),
  };
}

export function anwarzSample(request: SampleRequest, full = false) {
  const { events, ...rest } = request;
  // When "Charlotte confirmed" last emailed the customer (the app warns before sending it twice).
  const confirmed = events.filter((e) => e.type === 'supplier_confirmed').pop();
  return {
    ...rest,
    statusLabel: SAMPLE_STATUS_LABELS[request.status],
    confirmedAt: confirmed ? confirmed.createdAt.toISOString() : null,
    ...(full ? { events: [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) } : {}),
  };
}

export const ANWARZ_META = {
  carriers: CARRIERS.map((c) => ({ id: c.id, name: c.name })),
  orderStatuses: ORDER_STATUS_LABELS,
  sampleStatuses: SAMPLE_STATUS_LABELS,
};

export { rowToOrder, rowToSampleRequest };
