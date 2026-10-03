import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// The upload, media-library and debug routes are only used by the admin panel, so they sit behind
// the same admin login -- otherwise anyone could write files to the public storage bucket or
// list its contents.
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/upload/:path*', '/api/media', '/api/debug-models'],
};
