import { createHash } from 'crypto';
import { getOrder, logOrderEvent } from '@/lib/orders/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Order } from '@/lib/types/order';
import { SITE_URL } from '@/lib/site';

// Reports a paid order to GA4 and Meta straight from the server, alongside the browser tags. The
// browser report is lost whenever an ad blocker, a closed tab or a failed redirect stops the /success
// page from running -- often a fifth or more of sales -- so ad platforms under-count and
// under-optimise. Both platforms de-duplicate against the browser event using the order number
// (GA4 transaction_id, Meta event_id), so a sale reported both ways counts once.
//
// Each platform is used only if the shopper consented to it at checkout (see cleanAdSignals) and its
// credentials are set: GA4_API_SECRET (GA4 > Admin > Data streams > Measurement Protocol API secrets)
// and META_CAPI_ACCESS_TOKEN (Events Manager > Settings > Conversions API > Generate access token).

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE; // set while testing in Events Manager

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const dollars = (cents: number) => Math.round(cents) / 100;

export const hashEmail = (email: string) => sha256(email.trim().toLowerCase());

function itemsFor(order: Order) {
  return order.items.map((item) => ({
    id: item.sku || item.fabricId || item.itemType,
    name: item.name,
    category: item.itemType === 'fabric' || item.itemType === 'vinyl' ? 'Fabric' : item.itemType === 'benchCushion' ? 'Bench Cushion' : 'Custom Foam',
    price: dollars(item.unitPriceCents),
    quantity: item.quantity,
  }));
}

async function sendToGa4(order: Order): Promise<string> {
  const signals = order.adSignals!;
  if (!GA4_ID || !GA4_API_SECRET) return 'GA4: skipped (GA4_API_SECRET not set)';
  if (!signals.consent.analytics || !signals.gaClientId) return 'GA4: skipped (no analytics consent)';

  const ads = signals.consent.advertising ? 'GRANTED' : 'DENIED';
  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(GA4_ID)}&api_secret=${encodeURIComponent(GA4_API_SECRET)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: signals.gaClientId,
        consent: { ad_user_data: ads, ad_personalization: ads },
        events: [
          {
            name: 'purchase',
            params: {
              transaction_id: order.orderNumber,
              currency: order.currency.toUpperCase(),
              value: dollars(order.totalCents),
              tax: dollars(order.taxCents),
              shipping: dollars(order.shippingCents),
              ...(signals.gaSessionId ? { session_id: signals.gaSessionId } : {}),
              engagement_time_msec: 1,
              items: itemsFor(order).map((item) => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price,
                quantity: item.quantity,
              })),
            },
          },
        ],
      }),
    }
  );
  return response.ok ? 'GA4: sent' : `GA4: failed (${response.status})`;
}

async function sendToMeta(order: Order): Promise<string> {
  const signals = order.adSignals!;
  if (!META_PIXEL_ID || !META_TOKEN) return 'Meta: skipped (META_CAPI_ACCESS_TOKEN not set)';
  if (!signals.consent.advertising) return 'Meta: skipped (no advertising consent)';

  // Meta's matching rules: trimmed, lower-cased, then SHA-256 hashed. Phone needs the country code.
  const [firstName, ...rest] = order.customerName.trim().toLowerCase().split(/\s+/);
  const phoneDigits = (order.customerPhone || '').replace(/\D/g, '');
  const phone = phoneDigits.length === 10 ? `1${phoneDigits}` : phoneDigits;
  const hashed = (value: string | undefined) => (value ? [sha256(value)] : undefined);
  const items = itemsFor(order);

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${encodeURIComponent(META_PIXEL_ID)}/events?access_token=${encodeURIComponent(META_TOKEN)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(META_TEST_EVENT_CODE ? { test_event_code: META_TEST_EVENT_CODE } : {}),
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor((order.paidAt || new Date()).getTime() / 1000),
            event_id: order.orderNumber,
            action_source: 'website',
            event_source_url: `${SITE_URL}/success`,
            user_data: {
              em: hashed(order.customerEmail.trim().toLowerCase()),
              ph: hashed(phone || undefined),
              fn: hashed(firstName),
              ln: hashed(rest.length ? rest[rest.length - 1] : undefined),
              ct: hashed(order.shipCity.toLowerCase().replace(/[^a-z]/g, '')),
              st: hashed(order.shipRegion.toLowerCase()),
              zp: hashed(order.shipPostalCode.toLowerCase().replace(/\s/g, '')),
              country: hashed(order.shipCountry.toLowerCase()),
              external_id: hashed(order.customerEmail.trim().toLowerCase()),
              client_ip_address: signals.clientIp,
              client_user_agent: signals.userAgent,
              fbp: signals.fbp,
              fbc: signals.fbc,
            },
            custom_data: {
              currency: order.currency.toUpperCase(),
              value: dollars(order.totalCents),
              order_id: order.orderNumber,
              content_type: 'product',
              content_ids: items.map((item) => item.id),
              contents: items.map((item) => ({ id: item.id, quantity: item.quantity, item_price: item.price })),
              num_items: items.reduce((sum, item) => sum + item.quantity, 0),
            },
          },
        ],
      }),
    }
  );
  return response.ok ? 'Meta: sent' : `Meta: failed (${response.status} ${(await response.text()).slice(0, 200)})`;
}

// Called once per order, from whichever of the Stripe webhook or the /success confirmation first
// marks it paid. Never throws: reporting must not disturb order processing.
export async function reportPurchaseServerSide(orderId: string) {
  try {
    const order = await getOrder(orderId);
    if (!order?.adSignals) return; // placed before tracking existed, or storage was blocked
    if (order.isTest) return; // an admin test checkout is not a sale
    const results = await Promise.allSettled([sendToGa4(order), sendToMeta(order)]);
    const summary = results
      .map((result) => (result.status === 'fulfilled' ? result.value : `error: ${String(result.reason).slice(0, 120)}`))
      .join(' · ');
    await logOrderEvent(orderId, 'conversions', `Purchase reported to ad platforms: ${summary}`);
    await supabaseAdmin?.from('orders').update({ conversions_reported_at: new Date().toISOString() }).eq('id', orderId);
  } catch (error) {
    console.error(`Server-side conversion reporting failed for order ${orderId}:`, error);
  }
}
