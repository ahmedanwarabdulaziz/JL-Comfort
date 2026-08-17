import type { Metadata } from 'next';
import { getCategories } from '@/lib/data/categories';
import FoamPageClient from './FoamPageClient';

export const metadata: Metadata = {
  title: 'Order Custom Foam',
  description:
    'Design your custom cushion foam in two steps: choose a shape, enter your dimensions, and pick from four premium NeoGel High-Density compressions.',
};

// getCategories() always bypasses the fetch cache (see noStoreFetch in lib/supabase/client.ts),
// which trips Next's static prerenderer. This page must be rendered per-request.
export const dynamic = 'force-dynamic';

export default async function FoamPage() {
  const categories = await getCategories();

  return <FoamPageClient categories={categories} />;
}
