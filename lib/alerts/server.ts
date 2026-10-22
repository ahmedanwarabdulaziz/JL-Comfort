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
