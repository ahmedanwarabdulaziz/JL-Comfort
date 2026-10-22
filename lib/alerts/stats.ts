import { supabaseAdmin } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/alerts/server';
import { escapeHtml } from '@/lib/alerts/telegram';

// Sales figures for the Telegram bot and the daily summary. Server-only (service-role reads).
// Test orders never count. "Today" and "this month" are in the store's own time zone.

export const STORE_TIME_ZONE = 'America/Toronto';

/** Statuses that mean the customer paid (everything after pending_payment, except the dead ends). */
export const PAID_STATUSES = ['paid', 'sent_to_supplier', 'shipped', 'delivered', 'closed', 'problem'];

const zoneOffsetMs = (date: Date) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: STORE_TIME_ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)])
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(date.getTime() / 1000) * 1000;
};

/** Midnight in the store's time zone, `daysAgo` days back (0 = today). `monthStart` = the 1st. */
export function storeMidnight(daysAgo = 0, monthStart = false): Date {
  const local = new Date(Date.now() + zoneOffsetMs(new Date()));
  const guess = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), monthStart ? 1 : local.getUTCDate() - daysAgo);
  return new Date(guess - zoneOffsetMs(new Date(guess)));
}

export interface SalesSummary {
  orders: number;
  revenueCents: number;
  abandoned: number;
  samples: number;
  errors: number;
}

const db = () => {
  if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return supabaseAdmin;
};

export async function getSalesSummary(since: Date, until = new Date()): Promise<SalesSummary> {
  const from = since.toISOString();
  const to = until.toISOString();
  const [paid, abandoned, samples, errors] = await Promise.all([
    db().from('orders').select('total_cents').eq('is_test', false).in('status', PAID_STATUSES).gte('paid_at', from).lt('paid_at', to),
    db().from('orders').select('id', { count: 'exact', head: true }).eq('is_test', false).eq('status', 'expired').gte('created_at', from).lt('created_at', to),
    db().from('sample_requests').select('id', { count: 'exact', head: true }).gte('created_at', from).lt('created_at', to),
    db().from('app_events').select('id', { count: 'exact', head: true }).eq('level', 'error').gte('created_at', from).lt('created_at', to),
  ]);
  const failed = [paid, abandoned, samples, errors].find((result) => result.error);
  if (failed?.error) throw failed.error;
  const rows = (paid.data || []) as { total_cents: number }[];
  return {
    orders: rows.length,
    revenueCents: rows.reduce((sum, row) => sum + (row.total_cents || 0), 0),
    abandoned: abandoned.count || 0,
    samples: samples.count || 0,
    errors: errors.count || 0,
  };
}

/** Work waiting on someone: paid orders not yet sent to the supplier, sample requests not handled. */
export async function getPendingWork(olderThanHours = 24) {
  const before = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
  const [orders, samples] = await Promise.all([
    db().from('orders').select('order_number').eq('is_test', false).eq('status', 'paid').lt('paid_at', before).order('paid_at').limit(20),
    db().from('sample_requests').select('request_number').eq('status', 'pending').lt('created_at', before).order('created_at').limit(20),
  ]);
  return {
    orders: ((orders.data || []) as { order_number: string }[]).map((row) => row.order_number),
    samples: ((samples.data || []) as { request_number: string }[]).map((row) => row.request_number),
  };
}

/** A summary as a Telegram message. */
export function summaryMessage(title: string, s: SalesSummary) {
  return [
    `📊 <b>${escapeHtml(title)}</b>`,
    `Sales: <b>${formatMoney(s.revenueCents)}</b> from ${s.orders} order${s.orders === 1 ? '' : 's'}`,
    s.orders ? `Average order: ${formatMoney(Math.round(s.revenueCents / s.orders))}` : '',
    `Abandoned checkouts: ${s.abandoned}`,
    `Sample requests: ${s.samples}`,
    `Errors: ${s.errors ? `🔴 ${s.errors}` : '0'}`,
  ].filter(Boolean).join('\n');
}
