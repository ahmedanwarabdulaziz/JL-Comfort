import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TEST_MODE_COOKIE, isSignedInAdmin, resolveCheckoutMode } from '@/lib/stripe/testMode';
import { paymentProvider } from '@/lib/payments/provider';

// Tells the checkout page whether the next payment is a test or real, so an admin can't pay for
// real while thinking test payments are on. Uses the same rules as POST /api/checkout. Shoppers
// get `mode: null` and see no banner.
export async function GET() {
  const cookieStore = await cookies();
  const mode = cookieStore.get(TEST_MODE_COOKIE)?.value === '1'
    ? await resolveCheckoutMode()
    : (await isSignedInAdmin()) ? 'live' : null;
  return NextResponse.json({ mode, provider: paymentProvider() }, { headers: { 'Cache-Control': 'no-store' } });
}
