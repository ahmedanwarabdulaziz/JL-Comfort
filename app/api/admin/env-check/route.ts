import { NextResponse } from 'next/server';

// Admin-only (middleware.ts covers /api/admin/:path*). Shows which payment/email settings this
// deployment actually received from the host -- names, whether each has a value and its length,
// plus the non-secret key prefix (rk_live_, sk_test_, whsec_). Never the values themselves.
// Open /api/admin/env-check in a browser that's signed in to the admin panel.
const WATCHED = /STRIPE|RESEND|GA4|SUPABASE|SITE_URL/i;
const PREFIX = /^(?:sk|rk|pk)_(?:live|test)_|^whsec_|^re_/;

export const dynamic = 'force-dynamic';

export async function GET() {
  const variables: Record<string, { length: number; prefix: string | null }> = {};
  for (const name of Object.keys(process.env).filter((key) => WATCHED.test(key)).sort()) {
    const value = (process.env[name] || '').trim();
    variables[JSON.stringify(name)] = { length: value.length, prefix: value.match(PREFIX)?.[0] ?? null };
  }
  return NextResponse.json({
    deployment: {
      environment: process.env.VERCEL_ENV || null,
      commit: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || null,
      url: process.env.VERCEL_URL || null,
    },
    expected: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_TEST_SECRET_KEY', 'STRIPE_TEST_WEBHOOK_SECRET', 'RESEND_API_KEY', 'GA4_API_SECRET'].map(
      (name) => `${name}: ${(process.env[name] || '').trim() ? 'received' : 'MISSING'}`
    ),
    variables,
  });
}
