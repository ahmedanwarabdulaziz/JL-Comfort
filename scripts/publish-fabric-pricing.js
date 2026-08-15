/**
 * Republishes the Charlotte Fabrics pricing snapshot to R2 without re-crawling the site — a local
 * CLI equivalent of the admin panel's "Publish Pricing" button (app/api/admin/publish-fabric-pricing/
 * route.ts), for when running it from the admin UI isn't convenient (e.g. no login handy locally).
 *
 * Run:  node scripts/publish-fabric-pricing.js
 */

const { initFirebase, publishSnapshot } = require('./sync-charlotte-fabrics');
const admin = require('firebase-admin');

async function main() {
  initFirebase();
  const db = admin.firestore();
  try {
    const result = await publishSnapshot(db);
    console.log(result.published ? `✅ Published ${result.count} priced item(s).` : 'Publish skipped (see warning above).');
  } finally {
    await admin.app().delete();
  }
}

main();
