import { NextResponse } from 'next/server';
import { alertChatIds, sendTelegram, telegramApi } from '@/lib/alerts/telegram';

// Admin → Dashboard's Telegram box. Auth is enforced by middleware.ts (matcher covers /api/admin/:path*).
// GET: which settings are present and whether Telegram has the bot's webhook. POST: connect / test.

// Built from the address the admin panel is open on, not SITE_URL: Telegram doesn't follow redirects,
// and jlcomfort.com redirects to www.
const webhookUrl = (req: Request) => `${new URL(req.url).origin}/api/telegram/webhook`;

export async function GET(req: Request) {
  const status = {
    token: !!process.env.TELEGRAM_BOT_TOKEN?.trim(),
    chatIds: alertChatIds().length,
    webhookSecret: !!process.env.TELEGRAM_WEBHOOK_SECRET?.trim(),
    cronSecret: !!process.env.ALERTS_CRON_SECRET?.trim(),
    botName: null as string | null,
    connected: false,
    lastError: null as string | null,
  };
  if (status.token) {
    try {
      const [me, info] = await Promise.all([telegramApi('getMe', {}), telegramApi('getWebhookInfo', {})]);
      status.botName = me.username || null;
      status.connected = info.url === webhookUrl(req);
      status.lastError = info.last_error_message || null;
    } catch (error: any) {
      status.lastError = error.message;
    }
  }
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  const { action } = await req.json().catch(() => ({}));
  try {
    if (action === 'connect') {
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
      if (!secret) return NextResponse.json({ error: 'Add TELEGRAM_WEBHOOK_SECRET to the environment first.' }, { status: 400 });
      await telegramApi('setWebhook', { url: webhookUrl(req), secret_token: secret, allowed_updates: ['message'], drop_pending_updates: true });
      await telegramApi('setMyCommands', {
        commands: [
          { command: 'today', description: 'Sales so far today' },
          { command: 'yesterday', description: "Yesterday's sales" },
          { command: 'week', description: 'Last 7 days' },
          { command: 'month', description: 'This month' },
          { command: 'errors', description: 'The last 10 errors' },
          { command: 'pending', description: 'Work waiting over 24h' },
          { command: 'order', description: "One order's details, e.g. /order 1042" },
        ],
      });
      return NextResponse.json({ ok: true });
    }
    if (action === 'test') {
      if (alertChatIds().length === 0) return NextResponse.json({ error: 'Add TELEGRAM_CHAT_ID to the environment first.' }, { status: 400 });
      const sent = await sendTelegram('✅ <b>JL Comfort alerts are working.</b>\nNew orders, sample requests and errors will show up here.');
      return sent ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Telegram did not accept the message (check the token and chat ID).' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 502 });
  }
}
