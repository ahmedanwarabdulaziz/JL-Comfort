import { supabaseAdmin } from '@/lib/supabase/admin';
import { MARKETING_CONSENT_TEXT } from '@/lib/marketing/consent';

// Server-only: records express consent to marketing email (the checkout checkbox). One row per
// address in email_subscribers; ticking the box again re-subscribes someone who had unsubscribed.
// Leaving the box unticked changes nothing -- it never withdraws a consent given earlier.
export async function recordMarketingConsent(email: string, source: string, ip?: string) {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin.from('email_subscribers').upsert(
    {
      email: email.trim().toLowerCase(),
      status: 'subscribed',
      consent_text: MARKETING_CONSENT_TEXT,
      source,
      consented_at: new Date().toISOString(),
      consent_ip: ip || null,
      unsubscribed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );
  if (error) console.error('Recording marketing consent failed:', error);
}
