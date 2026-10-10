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

// Keys are read from the environment on every call rather than once when the server starts, so
// what checkout sees always matches the deployment's current settings (and /api/admin/env-check).
// One client per distinct key is reused.
const clients = new Map<string, Stripe>();
const clientFor = (key: string) => {
  if (!clients.has(key)) clients.set(key, new Stripe(key, { apiVersion: API_VERSION }));
  return clients.get(key)!;
};
const build = () => (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);

// Looks a variable up by name at run time, also accepting a name saved with stray spaces. Dynamic on
// purpose: on the host, one function received STRIPE_SECRET_KEY while checkout's didn't, and this
// rules out the bundler resolving a literal process.env.NAME differently.
function readEnv(name: string): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  if (env[name]) return env[name];
  const match = Object.keys(env).find((key) => key.trim() === name);
  return match ? env[match] : undefined;
}

/** What this function received (names and counts, never values) -- added to key errors. */
export function envSummary(): string {
  const keys = Object.keys(process.env);
  const stripeNames = keys.filter((key) => /STRIPE/i.test(key)).map((key) => JSON.stringify(key));
  const raw = (process.env as Record<string, unknown>).STRIPE_SECRET_KEY;
  const shape =
    typeof raw === 'string'
      ? `len ${raw.length}, starts ${JSON.stringify(raw.slice(0, 8))}, cleaned ${cleanSecretKey(raw, 'STRIPE_SECRET_KEY') ? 'ok' : 'FAIL'}`
      : typeof raw;
  return `${keys.length} vars; STRIPE_SECRET_KEY ${shape}; stripe: ${stripeNames.join(', ') || 'none'}`;
}

// The store's own key -- live in production. Every shopper pays through this one.
const readStoreKey = () => cleanSecretKey(readEnv('STRIPE_SECRET_KEY'), 'STRIPE_SECRET_KEY');

// Optional second key for admin test checkouts (see lib/stripe/testMode.ts). Only a test-mode key is
// accepted here, so a live key pasted into the wrong variable can't turn "test" orders into real charges.
function readTestKey(): string | undefined {
  const key = cleanSecretKey(readEnv('STRIPE_TEST_SECRET_KEY'), 'STRIPE_TEST_SECRET_KEY');
  if (key && !/^(?:sk|rk)_test_/.test(key)) {
    console.error('STRIPE_TEST_SECRET_KEY is not a test-mode key (sk_test_...); admin test checkout is disabled.');
    return undefined;
  }
  return key;
}

/** Which kind of key STRIPE_SECRET_KEY holds on this server -- shown in the admin bar, never the key. */
export function getStoreKeyMode(): 'live' | 'test' | 'missing' {
  const key = readStoreKey();
  return !key ? 'missing' : /_live_/.test(key) ? 'live' : 'test';
}

export const isTestKeyConfigured = () => !!readTestKey();

/** The client for an order: the test account for admin test orders, otherwise the store's own. */
export function stripeFor(testMode: boolean): Stripe {
  const key = testMode ? readTestKey() : readStoreKey();
  if (!key) {
    console.error(`Stripe key missing for ${testMode ? 'test' : 'store'} checkout [build ${build()}]: ${envSummary()}`);
    throw new Error(
      testMode
        ? `Test payments aren't set up (STRIPE_TEST_SECRET_KEY is missing or not a test key) [build ${build()}].`
        : `Payments are not set up on this server yet (STRIPE_SECRET_KEY is missing) [build ${build()}; ${envSummary()}]. Please try again shortly.`
    );
  }
  return clientFor(key);
}

// Webhook signatures are checked with the signing secret alone; no API key is involved.
export const webhookVerifier = new Stripe('sk_test_signature_check_only', { apiVersion: API_VERSION });

// Checkout Session ids say which mode they were created in: cs_test_... or cs_live_...
export const isTestSessionId = (sessionId: string) => sessionId.startsWith('cs_test_');
