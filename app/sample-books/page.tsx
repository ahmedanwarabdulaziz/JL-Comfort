import type { Metadata } from 'next';
import SampleBooksClient from '@/components/fabrics/SampleBooksClient';

export const metadata: Metadata = {
  title: 'Fabric Sample Books',
  alternates: { canonical: '/sample-books' },
  description: 'Browse our curated fabric sample book collections. Request free swatches shipped to your door before you buy.',
};

export default function SampleBooksPage() {
  return <SampleBooksClient />;
}
