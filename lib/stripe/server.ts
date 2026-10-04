import Stripe from 'stripe';

// A Stripe secret key is only letters, digits and underscores (sk_live_..., rk_live_..., sk_test_...).
// A value pasted into the host's env settings can pick up characters that are invisible there but
// illegal in an HTTP header -- a line break in the middle, a zero-width space, smart quotes, or the
// whole "STRIPE_SECRET_KEY=..." line -- and then every request fails with ERR_INVALID_CHAR in the
// Authorization header. So keep only the key itself, and log (without the key) what was dropped.
function cleanSecretKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const key = raw.replace(/[^A-Za-z0-9_]/g, '').match(/(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/)?.[0];
  if (!key) {
    console.error(`STRIPE_SECRET_KEY doesn't contain a Stripe secret key (length ${raw.length}).`);
    return undefined;
  }
  if (key !== raw) {
    const dropped = Array.from(raw.replace(key, ''))
      .map((char) => 'U+' + char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'))
      .join(' ');
    console.warn(`STRIPE_SECRET_KEY had extra characters that were ignored: ${dropped.length > 200 ? dropped.slice(0, 200) + '…' : dropped}`);
  }
  return key;
}

export const stripe = new Stripe(cleanSecretKey(process.env.STRIPE_SECRET_KEY) || 'sk_test_dummy_key_to_pass_build', {
  apiVersion: '2026-05-27.dahlia' as any, // Bypass strict TS check
});
