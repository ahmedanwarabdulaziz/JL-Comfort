import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TEST_MODE_COOKIE, isTestModeAvailable } from '@/lib/stripe/testMode';

// Turns admin test checkout on or off for this browser only. Auth is enforced by middleware.ts
// (matcher covers /api/admin/:path*), and checkout re-checks the admin login on every payment.

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json({
    testMode: cookieStore.get(TEST_MODE_COOKIE)?.value === '1',
    available: isTestModeAvailable(),
  });
}

export async function POST(req: Request) {
  const { testMode } = await req.json();
  if (testMode && !isTestModeAvailable()) {
    return NextResponse.json({ error: 'Add STRIPE_TEST_SECRET_KEY (an sk_test_ key) to the environment first.' }, { status: 400 });
  }
  const response = NextResponse.json({ testMode: !!testMode, available: isTestModeAvailable() });
  if (testMode) {
    response.cookies.set(TEST_MODE_COOKIE, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    response.cookies.delete(TEST_MODE_COOKIE);
  }
  return response;
}
