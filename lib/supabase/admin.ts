import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = (): boolean => {
  return !!(supabaseUrl && serviceRoleKey);
};

// Service-role client: bypasses RLS entirely. Server-only -- never import
// this from a 'use client' component. Used for trusted server-side writes
// that don't have (or shouldn't need) an admin session, e.g. the public
// sample-request submission route.
export const supabaseAdmin = isSupabaseAdminConfigured()
  ? createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : undefined;
