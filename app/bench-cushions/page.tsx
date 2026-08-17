import type { Metadata } from 'next';
import { getBenchCushionStyles } from '@/lib/data/benchCushions';
import BenchCushionsPageClient from './BenchCushionsPageClient';

export const metadata: Metadata = {
  title: 'Order Bench Cushions',
  description:
    'Design your custom bench cushion in two steps: choose a style, enter your dimensions, and pick your edge, fill, and trim options.',
};

// getBenchCushionStyles() always bypasses the fetch cache (see noStoreFetch in
// lib/supabase/client.ts), which trips Next's static prerenderer. This page must be
// rendered per-request.
export const dynamic = 'force-dynamic';

export default async function BenchCushionsPage() {
  const styles = await getBenchCushionStyles();

  return <BenchCushionsPageClient styles={styles} />;
}
