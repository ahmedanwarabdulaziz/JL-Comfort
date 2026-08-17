/**
 * Republishes the Charlotte Fabrics pricing snapshot to R2 without re-crawling the site — a local
 * CLI equivalent of the admin panel's "Publish Pricing" button (app/api/admin/publish-fabric-pricing/
 * route.ts), for when running it from the admin UI isn't convenient (e.g. no login handy locally).
 *
 * Run:  node scripts/publish-fabric-pricing.js
 */

const { publishSnapshot } = require('./sync-charlotte-fabrics');
const { getSupabaseAdmin } = require('./lib/supabaseAdmin');

async function main() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).');
    process.exitCode = 1;
    return;
  }

  const result = await publishSnapshot(supabase);
  console.log(result.published ? `✅ Published ${result.count} priced item(s).` : 'Publish skipped (see warning above).');
}

main();
