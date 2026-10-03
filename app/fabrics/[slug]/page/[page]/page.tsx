import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getCollection } from '@/lib/collections/definitions';
import { collectionMetadata, renderCollection } from '@/lib/collections/page';

// Page 2, 3, ... of a collection: /fabrics/velvet/page/2. Page 1 lives at /fabrics/velvet.
export const revalidate = 1800;

const parsePage = (value: string) => (/^\d+$/.test(value) ? Number(value) : NaN);

export async function generateMetadata({ params }: { params: { slug: string; page: string } }): Promise<Metadata> {
  const collection = getCollection(params.slug);
  if (!collection) return { title: 'Not Found', robots: { index: false } };
  return collectionMetadata(collection, parsePage(params.page));
}

export default async function CollectionPageN({ params }: { params: { slug: string; page: string } }) {
  const collection = getCollection(params.slug);
  const page = parsePage(params.page);
  if (!collection) notFound();
  // Page 1 has one address only: /fabrics/<slug>.
  if (page === 1) permanentRedirect(`/fabrics/${collection.slug}`);
  return renderCollection(collection, page);
}
