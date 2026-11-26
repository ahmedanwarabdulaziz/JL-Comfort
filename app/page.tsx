import { getHomeCatalog } from '@/lib/data/homeCatalog';
import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

// Title and description come from the root layout's defaults.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Served from cache and rebuilt at most every 30 minutes. A failed rebuild is deliberately not
// caught: Next then keeps serving the last good page instead of caching an empty one.
export const revalidate = 1800;

export default async function HomePage() {
  const catalog = await getHomeCatalog();

  return <HomePageClient catalog={catalog} />;
}
