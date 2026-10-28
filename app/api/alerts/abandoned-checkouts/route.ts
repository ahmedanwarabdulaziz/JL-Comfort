import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { formatMoney, recordAlert } from '@/lib/alerts/server';
import { getCheckoutSessions } from '@/lib/alerts/stats';

// "Checkout not completed": a shopper pressed Continue to secure payment (so an order was created)
// but hasn't paid an hour later -- the card was declined, the payment page failed, or they gave up.
// Called every 30 minutes by the n8n workflow "JL Comfort – unfinished checkouts to Telegram" with
// the header X-Alerts-Key: <ALERTS_CRON_SECRET>. Each abandoned checkout is alerted once: an
// "abandoned_alert" event on its latest order marks it done (and shows in that order's history).
const LOOKBACK_MS = 48 * 60 * 60 * 1000;
const MAX_PER_RUN = 10;

export async function POST(req: Request) {
  const secret = process.env.ALERTS_CRON_SECRET?.trim();
  if (!secret || req.headers.get('x-alerts-key') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });

  try {
    const sessions = (await getCheckoutSessions(new Date(Date.now() - LOOKBACK_MS))).filter((s) => s.outcome === 'abandoned');
    if (!sessions.length) return NextResponse.json({ alerted: 0 });

    const { data: done, error } = await supabaseAdmin
      .from('order_events').select('order_id').eq('type', 'abandoned_alert').in('order_id', sessions.map((s) => s.lastOrderId));
    if (error) throw error;
    const alreadyAlerted = new Set((done || []).map((event) => event.order_id));

    let alerted = 0;
    for (const s of sessions.filter((session) => !alreadyAlerted.has(session.lastOrderId)).slice(0, MAX_PER_RUN)) {
      const items = s.items.map((item) => `${item.quantity > 1 ? `${item.quantity} × ` : ''}${item.name}`);
      const minutes = Math.round((Date.now() - s.lastAt.getTime()) / 60000);
      await supabaseAdmin.from('order_events').insert({
        order_id: s.lastOrderId,
        type: 'abandoned_alert',
        message: 'Checkout not completed: sent a Telegram alert so the customer can be followed up.',
      });
      await recordAlert({
        level: 'warning',
        type: 'checkout_abandoned',
        icon: '🛒',
        title: `Checkout not completed: ${s.lastOrderNumber}`,
        detail: [
          `${s.name || 'Unknown'} · ${s.email}${s.phone ? ` · ${s.phone}` : ''}`,
          `${formatMoney(s.valueCents)} · ${items.length > 3 ? `${items.slice(0, 3).join(', ')} +${items.length - 3} more` : items.join(', ')}`,
          `${s.attempts > 1 ? `${s.attempts} tries, last` : 'Started'} ${minutes >= 120 ? `${Math.round(minutes / 60)} h` : `${minutes} min`} ago, never paid (declined card, payment page problem, or gave up).`,
        ].join('\n'),
        link: `/admin/orders?order=${s.lastOrderId}`,
      });
      alerted++;
    }
    return NextResponse.json({ alerted });
  } catch (error: any) {
    console.error('Abandoned checkout alerts failed:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
