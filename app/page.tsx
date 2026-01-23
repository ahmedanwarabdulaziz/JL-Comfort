import { getProducts } from '@/lib/data/products';
import HomePageClient from './HomePageClient';

export default async function HomePage() {
  const products = await getProducts();

  return <HomePageClient products={products} />;
}
