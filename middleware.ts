import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { REGION_COOKIE, type ConsentRegion } from '@/lib/consent';

const ADMIN_PATHS = ['/admin', '/api/admin', '/api/upload', '/api/media', '/api/debug-models'];

// Which cookie default applies to this visitor (see lib/consent.ts): Quebec gets the strict
// opt-in default, as does anyone whose location Vercel can't tell (and local development).
function consentRegion(request: NextRequest): ConsentRegion {
  const country = request.headers.get('x-vercel-ip-country');
  const region = request.headers.get('x-vercel-ip-country-region');
  if (!country) return 'strict';
  return country === 'CA' && (!region || region === 'QC') ? 'strict' : 'open';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return updateSession(request);
  }

  const response = NextResponse.next();
  const region = consentRegion(request);
  if (request.cookies.get(REGION_COOKIE)?.value !== region) {
    // Read by the browser (the banner and tag snippets), so not httpOnly. Holds no personal data.
    response.cookies.set(REGION_COOKIE, region, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure: true });
  }
  return response;
}

// The upload, media-library and debug routes are only used by the admin panel, so they sit behind
// the same admin login -- otherwise anyone could write files to the public storage bucket or
// list its contents. Every other page passes through only to get the cookie-default region; API
// routes, Next's own files, feeds and static files skip middleware entirely.
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/upload/:path*',
    '/api/media',
    '/api/debug-models',
    '/((?!api/|_next/|feeds/|images/|.*\\.[a-zA-Z0-9]+$).*)',
  ],
};
