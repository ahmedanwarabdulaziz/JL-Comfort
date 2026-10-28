import { NextResponse } from 'next/server';
import { escapeHtml, sendTelegram } from '@/lib/alerts/telegram';

// A new email in the sales@jlcomfort.com inbox, sent to the Telegram bot. Called by the n8n workflow
// "JL Comfort – new sales@ email to Telegram", which watches the mailbox (Microsoft Outlook trigger)
// and posts the message's sender, subject and preview here with the header
// X-Alerts-Key: <ALERTS_CRON_SECRET>, the same key as the daily summary.
const PREVIEW_LENGTH = 300;

export async function POST(req: Request) {
  const secret = process.env.ALERTS_CRON_SECRET?.trim();
  if (!secret || req.headers.get('x-alerts-key') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const from = String(body?.from || '').trim();
  if (!from) return NextResponse.json({ error: 'Missing "from"' }, { status: 400 });
  const fromName = String(body?.fromName || '').trim();
  const subject = String(body?.subject || '').trim() || '(no subject)';
  const preview = String(body?.preview || '').replace(/\s+/g, ' ').trim();
  const webLink = String(body?.webLink || '');

  const lines = [
    '📩 <b>New email to sales@</b>',
    `From: ${escapeHtml(fromName && fromName !== from ? `${fromName} (${from})` : from)}`,
    `Subject: <b>${escapeHtml(subject)}</b>`,
  ];
  if (preview) lines.push('', `"${escapeHtml(preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview)}"`);
  // Only Outlook's own links, so a forged body can't add an arbitrary link to the alert.
  if (/^https:\/\/outlook\.(office|office365|live)\.com\//.test(webLink)) lines.push('', `<a href="${escapeHtml(webLink)}">Open in Outlook</a>`);

  const sent = await sendTelegram(lines.join('\n'));
  return NextResponse.json({ sent }, { status: sent ? 200 : 502 });
}
