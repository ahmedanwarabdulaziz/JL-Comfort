import type { Metadata } from 'next';
import { getCategories } from '@/lib/data/categories';
import FoamPageClient from './FoamPageClient';

export const metadata: Metadata = {
  title: 'Order Custom Foam',
  description:
    'Design your custom cushion foam in two steps: choose a shape, enter your dimensions, and pick from four premium NeoGel High-Density compressions.',
};

export default async function FoamPage() {
  const categories = await getCategories();

  return <FoamPageClient categories={categories} />;
}
