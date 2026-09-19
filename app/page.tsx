import { getProducts } from '@/lib/data/products';
import { getFeaturedFabricsByMaterial } from '@/lib/data/charlotteFabricCatalog';
import HomePageClient from './HomePageClient';

// getProducts() always bypasses the fetch cache (see noStoreFetch in lib/supabase/client.ts),
// which trips Next's static prerenderer. This page must be rendered per-request.
export const dynamic = 'force-dynamic';

const MOSAIC_MATERIALS = ['velvet', 'linen', 'boucle', 'chenille'];

export default async function HomePage() {
  const [products, materialImages] = await Promise.all([
    getProducts(),
    getFeaturedFabricsByMaterial(MOSAIC_MATERIALS),
  ]);

  return <HomePageClient products={products} materialImages={materialImages} />;
}
