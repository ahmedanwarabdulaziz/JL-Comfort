import { getProducts } from '@/lib/data/products';
import HomePageClient from './HomePageClient';

// getProducts() always bypasses the fetch cache (see noStoreFetch in lib/supabase/client.ts),
// which trips Next's static prerenderer. This page must be rendered per-request.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await getProducts();

  return <HomePageClient products={products} />;
}
