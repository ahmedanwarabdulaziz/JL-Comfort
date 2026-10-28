import { supabaseAdmin } from '@/lib/supabase/admin';
import { SITE_URL } from '@/lib/site';
import { Order } from '@/lib/types/order';
import { SampleRequest } from '@/lib/types/sampleRequest';
import { escapeHtml, sendTelegram } from '@/lib/alerts/telegram';

// Instant alerts: each one is saved in app_events (listed on the admin Dashboard) and sent to the
// JL Comfort Telegram bot. Server-only. Nothing here ever throws -- an alert failing must never
// break the checkout, payment webhook or email it is reporting on.

export type AlertLevel = 'info' | 'warning' | 'error';

const ICONS: Record<AlertLevel, string> = { info: '🟢', warning: '🟠', error: '🔴' };

export const formatMoney = (cents: number, currency = 'cad') =>
  `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.toUpperCase()}`;

export async function recordAlert(alert: {
  level: AlertLevel;
  type: string;
  title: string;
  detail?: string;
  link?: string; // admin path, e.g. /admin/orders?order=<id>
  isTest?: boolean;
  icon?: string; // replaces the level's colour dot in the Telegram message
}) {
  const { level, type, title, detail, link, isTest = false } = alert;
  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('app_events')
        .insert({ level, type, title, detail: detail || null, link: link || null, is_test: isTest });
      if (error) console.error('Saving alert failed:', error);
    }
  } catch (error) {
    console.error('Saving alert failed:', error);
  }

  const lines = [`${alert.icon || ICONS[level]} ${isTest ? '🧪 <b>TEST</b> ' : ''}<b>${escapeHtml(title)}</b>`];
  if (detail) lines.push(escapeHtml(detail));
  if (link) lines.push(`<a href="${SITE_URL}${link}">Open in admin</a>`);
  await sendTelegram(lines.join('\n'));
}

/** Reports a caught error. `source` is a short machine name, e.g. "stripe_webhook". */
export async function reportError(source: string, title: string, error: unknown, link?: string) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
  await recordAlert({ level: 'error', type: source, title, detail: (message || 'Unknown error').slice(0, 1500), link });
}

/** Sent once per order, when the payment is first confirmed (from sendNewOrderEmails). */
export async function alertNewOrder(order: Order, supplierStatus: string) {
  const items = order.items.map((item) => (item.quantity > 1 ? `${item.quantity} × ${item.name}` : item.name));
  const detail = [
    `${formatMoney(order.totalCents, order.currency)} · ${order.customerName} · ${order.shipCity}, ${order.shipRegion}`,
    items.length > 3 ? `${items.slice(0, 3).join(', ')} +${items.length - 3} more` : items.join(', '),
    order.discountLabel ? `Discount: ${order.discountLabel}` : '',
    `Supplier: ${supplierStatus}`,
  ].filter(Boolean).join('\n');
  await recordAlert({
    level: 'info',
    type: 'order_paid',
    icon: '💰',
    title: `New order ${order.orderNumber}`,
    detail,
    link: `/admin/orders?order=${order.id}`,
    isTest: order.isTest,
  });
}

export async function alertNewSampleRequest(request: SampleRequest, supplierStatus: string) {
  await recordAlert({
    level: 'info',
    type: 'sample_request',
    icon: '🧵',
    title: `New sample request ${request.requestNumber}`,
    detail: `${request.items.length} sample${request.items.length === 1 ? '' : 's'} · ${request.name} · ${request.address.city}, ${request.address.state}\nSupplier: ${supplierStatus}`,
    link: `/admin/sample-requests?request=${request.id}`,
  });
}

/** "jane@x.com · 2 yd D4410 Eve Oyster, 1 × Foam" from a checkout request, for an alert's detail. */
export function describeCheckoutAttempt(email: unknown, items: unknown): string {
  const list = Array.isArray(items) ? items : [];
  const names = list.slice(0, 3).map((item: any) => {
    const name = String(item?.fabricName || item?.name || item?.productType || 'item');
    const qty = Number(item?.quantity) || 1;
    return item?.productType === 'fabric' ? `${qty} yd ${name}` : qty > 1 ? `${qty} × ${name}` : name;
  });
  if (list.length > 3) names.push(`+${list.length - 3} more`);
  return [typeof email === 'string' && email.trim() ? email.trim() : 'no email yet', names.join(', ')].filter(Boolean).join(' · ');
}

/**
 * A shopper was stopped at checkout by an error message (shipping quote or "Continue to secure
 * payment"). The routes calling this are public, so a repeat of the same problem within 10 minutes is
 * skipped and at most 10 of these go out per 10 minutes -- a bot can't flood the bot.
 */
export async function alertCheckoutBlocked(stage: string, reason: string, context?: string) {
  const detail = [`Customer saw: "${reason}"`, context].filter(Boolean).join('\n');
  try {
    if (supabaseAdmin) {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data } = await supabaseAdmin
        .from('app_events').select('detail').eq('type', 'checkout_blocked').gte('created_at', since).limit(10);
      if (data && (data.length >= 10 || data.some((event) => event.detail === detail))) return;
    }
  } catch (error) {
    console.error('Checking recent checkout alerts failed:', error);
  }
  await recordAlert({ level: 'warning', type: 'checkout_blocked', icon: '⚠️', title: `Checkout problem (${stage}): a customer was stopped`, detail });
}
