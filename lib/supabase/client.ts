import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// This client is also used from Server Components (via lib/data/*.ts) for
// anonymous public reads. Next.js patches the global `fetch` there and
// caches responses indefinitely by default, which would silently serve
// stale data (e.g. an admin edit never showing up). Force every request to
// bypass that cache -- these reads are cheap and freshness matters more.
const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });

export const supabase = isSupabaseConfigured()
  ? createBrowserClient(supabaseUrl!, supabaseAnonKey!, { global: { fetch: noStoreFetch } })
  : undefined;
