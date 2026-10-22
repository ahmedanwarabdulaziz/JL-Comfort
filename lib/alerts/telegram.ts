// Sends messages from the JL Comfort Telegram bot. Server-only.
//   TELEGRAM_BOT_TOKEN       from @BotFather
//   TELEGRAM_CHAT_ID         who receives alerts; comma-separate several (get yours from @userinfobot)
//   TELEGRAM_WEBHOOK_SECRET  any long random string; Telegram sends it back on every bot command
//                            so /api/telegram/webhook knows the request is real

const API = 'https://api.telegram.org';

const token = () => process.env.TELEGRAM_BOT_TOKEN?.trim() || '';

export const alertChatIds = () =>
  (process.env.TELEGRAM_CHAT_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

export const isTelegramConfigured = () => !!token() && alertChatIds().length > 0;

/** Escapes text for Telegram's HTML parse mode. */
export const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function telegramApi(method: string, body: Record<string, unknown>): Promise<any> {
  if (!token()) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  // Short timeout: an alert must never hold up a checkout or a payment webhook.
  const response = await fetch(`${API}/bot${token()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!result.ok) throw new Error(`Telegram ${method} failed: ${result.description || response.status}`);
  return result.result;
}

/** Sends an HTML message to one chat, or to every alert chat. Never throws. */
export async function sendTelegram(html: string, chatId?: string | number): Promise<boolean> {
  const chats = chatId !== undefined ? [String(chatId)] : alertChatIds();
  if (!token() || chats.length === 0) return false;
  let allSent = true;
  for (const chat of chats) {
    try {
      // Telegram rejects messages over 4096 characters.
      await telegramApi('sendMessage', { chat_id: chat, text: html.slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (error) {
      console.error('Telegram alert failed:', error);
      allSent = false;
    }
  }
  return allSent;
}
