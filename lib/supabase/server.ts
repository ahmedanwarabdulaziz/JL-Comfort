import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// For public data (RLS lets anyone read it) on cached pages. Unlike createSupabaseServerClient it
// doesn't touch cookies(), which would make the page dynamic: a fabric page using it is rendered
// once per `revalidate` window and served from Vercel's cache, instead of running a function and
// a database query on every view -- which is what let scrapers multiply function invocations.
let publicClient: SupabaseClient | undefined;
export function createSupabasePublicClient() {
  if (!isSupabaseConfigured()) return undefined;
  publicClient ??= createClient(supabaseUrl!, supabaseAnonKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  return publicClient;
}

// For use in Server Components / Route Handlers / Server Actions.
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return undefined;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component with no request/response to write
          // cookies to -- safe to ignore since middleware refreshes sessions.
        }
      },
    },
  });
}
