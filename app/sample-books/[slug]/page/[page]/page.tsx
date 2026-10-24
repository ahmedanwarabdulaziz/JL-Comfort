import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { sampleBookCollection } from '@/lib/collections/sampleBookCollection';
import { collectionMetadata, renderCollection } from '@/lib/collections/page';

// Page 2, 3, ... of a sample book. Page 1 lives at /sample-books/<slug>.
export const revalidate = 1800;

const parsePage = (value: string) => (/^\d+$/.test(value) ? Number(value) : NaN);

export async function generateMetadata({ params }: { params: { slug: string; page: string } }): Promise<Metadata> {
  const collection = await sampleBookCollection(params.slug);
  if (!collection) return { title: 'Not Found', robots: { index: false } };
  return collectionMetadata(collection, parsePage(params.page));
}

export default async function SampleBookPageN({ params }: { params: { slug: string; page: string } }) {
  const collection = await sampleBookCollection(params.slug);
  const page = parsePage(params.page);
  if (!collection) notFound();
  if (page === 1) permanentRedirect(`/sample-books/${collection.slug}`);
  return renderCollection(collection, page);
}
