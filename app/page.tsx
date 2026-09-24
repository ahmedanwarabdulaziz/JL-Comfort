import { getHomeCatalog } from '@/lib/data/homeCatalog';
import HomePageClient from './HomePageClient';

// Rendered per request; the catalog summary itself is cached for 30 minutes (lib/data/homeCatalog.ts),
// so a visit doesn't page through the fabric table.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const catalog = await getHomeCatalog().catch((error) => {
    console.error('Homepage catalog summary failed:', error);
    return { collections: [], materials: [] };
  });

  return <HomePageClient catalog={catalog} />;
}
