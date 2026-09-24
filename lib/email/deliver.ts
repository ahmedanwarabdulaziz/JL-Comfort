import { supabaseAdmin } from '@/lib/supabase/admin';
import { isEmailConfigured, sendEmail } from '@/lib/email/resend';
import { EmailContent } from '@/lib/email/layout';
import { EmailSettings, VERIFIED_SENDING_DOMAINS, rowToEmailSettings } from '@/lib/types/order';

// Sending shared by orders and sample requests. Server-only.

export async function getEmailSettings(): Promise<EmailSettings> {
  if (!supabaseAdmin) throw new Error('Supabase service role is not configured');
  const { data, error } = await supabaseAdmin.from('email_settings').select('*').eq('id', true).maybeSingle();
  if (error) throw error;
  return rowToEmailSettings(data);
}

const isVerifiedSender = (address: string) =>
  VERIFIED_SENDING_DOMAINS.includes(address.split('@')[1]?.toLowerCase() || '');

/**
 * Sends one email and records the outcome through `log` (an order's or sample request's history).
 * Never throws: a failure is logged as `email_failed` and reported as false.
 */
export async function deliverEmail(options: {
  settings: EmailSettings;
  to: string;
  content: EmailContent;
  eventType: string;
  log: (type: string, message: string) => Promise<void>;
  context: string; // e.g. "Order JL-1002", for server logs
  idempotencyKey?: string;
}): Promise<boolean> {
  const { settings, to, content, eventType, log, context, idempotencyKey } = options;
  try {
    if (!isEmailConfigured()) throw new Error('RESEND_API_KEY is not set');
    if (!isVerifiedSender(settings.fromEmail)) {
      throw new Error(`From address ${settings.fromEmail} is not on a verified domain (${VERIFIED_SENDING_DOMAINS.join(', ')})`);
    }
    const { id } = await sendEmail({
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: [to],
      replyTo: settings.replyTo || undefined,
      subject: content.subject,
      html: content.html,
      text: content.text,
      idempotencyKey,
    });
    // The Resend id matches the email in the Resend dashboard (Emails), which shows delivered/bounced.
    await log(eventType, `Emailed ${to}: "${content.subject}" (Resend id ${id})`);
    return true;
  } catch (error: any) {
    console.error(`${context}: ${eventType} email failed`, error);
    await log('email_failed', `Could not email ${to} (${eventType}): ${error.message || error}`);
    return false;
  }
}
