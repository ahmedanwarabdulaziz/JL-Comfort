import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { stripeTest } from '@/lib/stripe/server';

// Admin-only test checkout. An admin turns it on from the admin panel, which sets this cookie in
// their browser only; their checkouts then go to the Stripe test account and the order is marked as
// a test. The cookie alone proves nothing (anyone can set a cookie), so checkout also checks that
// the browser is signed in as an admin -- for every other shopper, payment is always live.
export const TEST_MODE_COOKIE = 'jl_stripe_test_mode';

export const isTestModeAvailable = () => !!stripeTest;

export async function isSignedInAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: adminRow } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  return !!adminRow;
}

/**
 * Which Stripe mode this checkout uses:
 *   'live'           -- the normal case, and the only one a shopper can get.
 *   'test'           -- test mode is on in this browser and it's signed in as an admin.
 *   'admin_required' -- test mode is on but the admin login has lapsed. Checkout stops (and clears
 *                       the cookie) rather than quietly charging the admin real money.
 */
export async function resolveCheckoutMode(): Promise<'live' | 'test' | 'admin_required'> {
  const cookieStore = await cookies();
  if (cookieStore.get(TEST_MODE_COOKIE)?.value !== '1') return 'live';
  if (!stripeTest || !(await isSignedInAdmin())) return 'admin_required';
  return 'test';
}
