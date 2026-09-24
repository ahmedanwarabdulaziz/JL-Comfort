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
