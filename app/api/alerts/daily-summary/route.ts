import { NextResponse } from 'next/server';
import { sendTelegram } from '@/lib/alerts/telegram';
import { formatMoney } from '@/lib/alerts/server';
import { getPendingWork, getSalesSummary, storeMidnight, summaryMessage } from '@/lib/alerts/stats';

// The evening summary, sent to the Telegram bot. Called by the n8n workflow
// "JL Comfort – daily summary (9 PM)" with the header X-Alerts-Key: <ALERTS_CRON_SECRET>.
export async function POST(req: Request) {
  const secret = process.env.ALERTS_CRON_SECRET?.trim();
  if (!secret || req.headers.get('x-alerts-key') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [today, month, pending] = await Promise.all([
      getSalesSummary(storeMidnight(0)),
      getSalesSummary(storeMidnight(0, true)),
      getPendingWork(24),
    ]);
    const lines = [
      summaryMessage('Today', today),
      '',
      `<b>This month:</b> ${formatMoney(month.revenueCents)} from ${month.orders} order${month.orders === 1 ? '' : 's'}`,
    ];
    if (pending.orders.length) lines.push('', `⏳ Paid, not sent to supplier: ${pending.orders.join(', ')}`);
    if (pending.samples.length) lines.push('', `⏳ Sample requests waiting: ${pending.samples.join(', ')}`);
    const sent = await sendTelegram(lines.join('\n'));
    return NextResponse.json({ sent, today, month, pending });
  } catch (error: any) {
    console.error('Daily summary failed:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
