import { getCategories } from '@/lib/data/categories';
import FoamPageClient from './FoamPageClient';

export default async function FoamPage() {
  const categories = await getCategories();

  return <FoamPageClient categories={categories} />;
}
