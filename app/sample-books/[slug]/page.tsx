import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { sampleBookCollection } from '@/lib/collections/sampleBookCollection';
import { collectionMetadata, renderCollection } from '@/lib/collections/page';

// One Charlotte sample book: /sample-books/textured-plains-ii. Same layout as the fabric collections.
export const revalidate = 1800;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = await sampleBookCollection(params.slug);
  if (!collection) return { title: 'Not Found', robots: { index: false } };
  return collectionMetadata(collection, 1);
}

export default async function SampleBookPage({ params }: { params: { slug: string } }) {
  const collection = await sampleBookCollection(params.slug);
  if (!collection) notFound();
  return renderCollection(collection, 1);
}
