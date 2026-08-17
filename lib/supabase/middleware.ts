import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const LOGIN_PATH = '/admin/login';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { pathname } = request.nextUrl;
  const isApiPath = pathname.startsWith('/api/');
  const isLoginPage = pathname === LOGIN_PATH;

  const deny = (reason: string, redirectParams?: Record<string, string>) => {
    if (isApiPath) return unauthorizedJson(reason);
    if (isLoginPage) return response;
    return redirectTo(request, LOGIN_PATH, redirectParams);
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    // Fail closed: an unconfigured Supabase client must not leave /admin open.
    return deny('not_configured', { error: 'not_configured' });
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return deny('unauthenticated');
  }

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return deny('not_admin', { error: 'not_admin' });
  }

  if (isLoginPage) {
    return redirectTo(request, '/admin');
  }

  return response;
}

function redirectTo(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return NextResponse.redirect(url);
}

function unauthorizedJson(reason: string) {
  return NextResponse.json({ error: 'Unauthorized', reason }, { status: 401 });
}
