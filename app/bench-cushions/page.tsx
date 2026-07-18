import type { Metadata } from 'next';
import { getBenchCushionStyles } from '@/lib/data/benchCushions';
import BenchCushionsPageClient from './BenchCushionsPageClient';

export const metadata: Metadata = {
  title: 'Order Bench Cushions',
  description:
    'Design your custom bench cushion in two steps: choose a style, enter your dimensions, and pick your edge, fill, and trim options.',
};

export default async function BenchCushionsPage() {
  const styles = await getBenchCushionStyles();

  return <BenchCushionsPageClient styles={styles} />;
}
