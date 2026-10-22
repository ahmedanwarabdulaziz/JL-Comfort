import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SITE_URL } from '@/lib/site';
import { alertChatIds, escapeHtml, sendTelegram } from '@/lib/alerts/telegram';
import { formatMoney } from '@/lib/alerts/server';
import { STORE_TIME_ZONE, getPendingWork, getSalesSummary, storeMidnight, summaryMessage } from '@/lib/alerts/stats';

// Telegram calls this for every message sent to the JL Comfort bot. Connected from Admin → Dashboard
// ("Connect bot"), which registers this URL with TELEGRAM_WEBHOOK_SECRET; Telegram sends the secret
// back in a header, so nobody else can post here. Only chats in TELEGRAM_CHAT_ID get answers.

const HELP = [
  '<b>JL Comfort bot</b>',
  '/today — sales so far today',
  '/yesterday — yesterday\'s sales',
  '/week — last 7 days',
  '/month — this month',
  '/errors — the last 10 errors',
  '/pending — orders and sample requests waiting over 24h',
  '/order 1042 — one order\'s details',
].join('\n');

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', { timeZone: STORE_TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' });

async function recentErrors() {
  const { data, error } = await supabaseAdmin!
    .from('app_events')
    .select('title, detail, created_at')
    .in('level', ['error', 'warning'])
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  if (!data?.length) return '✅ No errors or warnings recorded.';
  return ['<b>Last errors & warnings</b>', ...data.map((e) => `\n• <b>${escapeHtml(e.title)}</b> — ${when(e.created_at)}${e.detail ? `\n${escapeHtml(e.detail.slice(0, 300))}` : ''}`)].join('\n');
}

async function orderDetails(arg: string) {
  const number = arg.trim().toUpperCase();
  if (!number) return 'Send the order number, e.g. /order 1042';
  const orderNumber = /^\d+$/.test(number) ? `JL-${number}` : number;
  const { data: order, error } = await supabaseAdmin!
    .from('orders')
    .select('*, order_items(name, quantity, amount_cents)')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (error) throw error;
  if (!order) return `No order ${escapeHtml(orderNumber)} found.`;
  return [
    `🧾 <b>${escapeHtml(order.order_number)}</b>${order.is_test ? ' 🧪 TEST' : ''} — ${escapeHtml(order.status.replace(/_/g, ' '))}`,
    `${formatMoney(order.total_cents, order.currency)} · ${escapeHtml(order.customer_name)} · ${escapeHtml(order.ship_city)}, ${escapeHtml(order.ship_region)}`,
    ...(order.order_items || []).map((i: any) => `• ${i.quantity} × ${escapeHtml(i.name)} — ${formatMoney(i.amount_cents, order.currency)}`),
    `Placed ${when(order.created_at)}${order.paid_at ? ` · paid ${when(order.paid_at)}` : ''}`,
    order.tracking_number ? `Tracking: ${escapeHtml(order.carrier || '')} ${escapeHtml(order.tracking_number)}` : '',
    `<a href="${SITE_URL}/admin/orders?order=${order.id}">Open in admin</a>`,
  ].filter(Boolean).join('\n');
}

async function pendingWork() {
  const pending = await getPendingWork(24);
  if (!pending.orders.length && !pending.samples.length) return '✅ Nothing waiting over 24 hours.';
  return [
    '⏳ <b>Waiting over 24 hours</b>',
    pending.orders.length ? `Paid, not sent to supplier: ${pending.orders.join(', ')}` : '',
    pending.samples.length ? `Sample requests not handled: ${pending.samples.join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

async function answer(command: string, arg: string): Promise<string> {
  switch (command) {
    case '/today':
      return summaryMessage('Today', await getSalesSummary(storeMidnight(0)));
    case '/yesterday':
      return summaryMessage('Yesterday', await getSalesSummary(storeMidnight(1), storeMidnight(0)));
    case '/week':
      return summaryMessage('Last 7 days', await getSalesSummary(storeMidnight(6)));
    case '/month':
      return summaryMessage('This month', await getSalesSummary(storeMidnight(0, true)));
    case '/errors':
      return recentErrors();
    case '/pending':
      return pendingWork();
    case '/order':
      return orderDetails(arg);
    default:
      return HELP;
  }
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const message = update?.message;
  const text: string = message?.text || '';
  const chatId = message?.chat?.id;
  // Always answer 200: anything else makes Telegram resend the same update over and over.
  if (!chatId || !text) return NextResponse.json({ ok: true });

  if (!alertChatIds().includes(String(chatId))) {
    // The chat id is what goes in TELEGRAM_CHAT_ID, so saying it here is how the owner finds theirs.
    await sendTelegram(`This chat isn't connected to JL Comfort.\nYour chat ID is <code>${chatId}</code> — add it to TELEGRAM_CHAT_ID in Vercel.`, chatId);
    return NextResponse.json({ ok: true });
  }

  const [rawCommand, ...rest] = text.trim().split(/\s+/);
  const command = rawCommand.toLowerCase().replace(/@.*$/, ''); // "/today@JLComfortBot" in groups
  try {
    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    await sendTelegram(await answer(command, rest.join(' ')), chatId);
  } catch (error: any) {
    console.error('Telegram command failed:', error);
    await sendTelegram(`🔴 Couldn't answer ${escapeHtml(command)}: ${escapeHtml(error.message || String(error))}`, chatId);
  }
  return NextResponse.json({ ok: true });
}
