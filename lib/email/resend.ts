// Minimal Resend client (https://resend.com/docs/api-reference/emails/send-email). Server-only:
// RESEND_API_KEY must never reach the browser.

export interface OutgoingEmail {
  from: string; // "Name <address>"
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string; // Resend drops a repeat send with the same key within 24h
}

export const isEmailConfigured = (): boolean => !!process.env.RESEND_API_KEY;

/**
 * Formats an RFC 5322 address ("Name <email>"), quoting the name if it contains characters that
 * would otherwise break the header. Falls back to the bare address when there's no name -- used
 * for every From, Reply-To and To this app sends, so a customer or supplier always sees a real
 * name ("JL Comfort", their own name) instead of a raw email address in their inbox.
 */
export const formatAddress = (name: string | undefined | null, email: string): string => {
  const trimmed = (name || '').trim();
  if (!trimmed) return email;
  const needsQuotes = /[",<>@]/.test(trimmed);
  return needsQuotes ? `"${trimmed.replace(/"/g, '\\"')}" <${email}>` : `${trimmed} <${email}>`;
};

export async function sendEmail(email: OutgoingEmail): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(email.idempotencyKey ? { 'Idempotency-Key': email.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: email.from,
      to: email.to,
      reply_to: email.replyTo || undefined,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || `Resend responded ${response.status}`);
  return { id: body.id };
}
