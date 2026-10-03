import { getHomeCatalog } from '@/lib/data/homeCatalog';
import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

// Title and description come from the root layout's defaults.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Rendered per request; the catalog summary itself is cached for 30 minutes (lib/data/homeCatalog.ts),
// so a visit doesn't page through the fabric table.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const catalog = await getHomeCatalog().catch((error) => {
    console.error('Homepage catalog summary failed:', error);
    return { collections: [], materials: [], groups: [] };
  });

  return <HomePageClient catalog={catalog} />;
}
