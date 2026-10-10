import Stripe from 'stripe';

// A Stripe secret key is only letters, digits and underscores (sk_live_..., rk_live_..., sk_test_...).
// A value pasted into the host's env settings can pick up characters that are invisible there but
// illegal in an HTTP header -- a line break in the middle, a zero-width space, smart quotes, or the
// whole "STRIPE_SECRET_KEY=..." line -- and then every request fails with ERR_INVALID_CHAR in the
// Authorization header. So keep only the key itself, and log (without the key) what was dropped.
function cleanSecretKey(raw: string | undefined, name: string): string | undefined {
  if (!raw) return undefined;
  const key = raw.replace(/[^A-Za-z0-9_]/g, '').match(/(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/)?.[0];
  if (!key) {
    console.error(`${name} doesn't contain a Stripe secret key (length ${raw.length}).`);
    return undefined;
  }
  if (key !== raw) {
    const dropped = Array.from(raw.replace(key, ''))
      .map((char) => 'U+' + char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'))
      .join(' ');
    console.warn(`${name} had extra characters that were ignored: ${dropped.length > 200 ? dropped.slice(0, 200) + '…' : dropped}`);
  }
  return key;
}

const API_VERSION = '2026-05-27.dahlia' as any; // Bypass strict TS check

// The store's own key -- live in production. Every shopper pays through this one.
export const stripe = new Stripe(cleanSecretKey(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY') || 'sk_test_dummy_key_to_pass_build', {
  apiVersion: API_VERSION,
});

// Optional second key for admin test checkouts (see lib/stripe/testMode.ts). Only a test-mode key is
// accepted here, so a live key pasted into the wrong variable can't turn "test" orders into real charges.
const testKey = cleanSecretKey(process.env.STRIPE_TEST_SECRET_KEY, 'STRIPE_TEST_SECRET_KEY');
if (testKey && !/^(?:sk|rk)_test_/.test(testKey)) {
  console.error('STRIPE_TEST_SECRET_KEY is not a test-mode key (sk_test_...); admin test checkout is disabled.');
}
export const stripeTest = testKey && /^(?:sk|rk)_test_/.test(testKey) ? new Stripe(testKey, { apiVersion: API_VERSION }) : null;

/** The client for an order: the test account for admin test orders, otherwise the store's own. */
export function stripeFor(testMode: boolean): Stripe {
  if (!testMode) return stripe;
  if (!stripeTest) throw new Error('STRIPE_TEST_SECRET_KEY is not set.');
  return stripeTest;
}

// Checkout Session ids say which mode they were created in: cs_test_... or cs_live_...
export const isTestSessionId = (sessionId: string) => sessionId.startsWith('cs_test_');
