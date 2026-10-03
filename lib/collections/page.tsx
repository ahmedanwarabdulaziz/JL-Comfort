import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CollectionPage, { CollectionLink } from '@/components/collections/CollectionPage';
import type { CardColourway } from '@/components/fabrics/FabricCard';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { FabricCollection, collectionGroups, collectionHref, getCollection } from './definitions';
import { COLLECTION_PAGE_SIZE, loadCollectionFabrics } from './server';

// Server side of a collection page, shared by /fabrics/<slug> and /fabrics/<slug>/page/<n>.

const toLink = (collection: FabricCollection): CollectionLink => ({ slug: collection.slug, label: collection.label, group: collection.group });

export async function collectionMetadata(collection: FabricCollection, page: number): Promise<Metadata> {
  const url = collectionHref(collection.slug, page);
  const title = page > 1 ? `${collection.metaTitle} – Page ${page}` : collection.metaTitle;
  const fabrics = await loadCollectionFabrics(collection).catch(() => []);
  const image = fabrics[0]?.imageUrl;
  return {
    title,
    description: collection.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_CA',
      title: collection.title,
      description: collection.description,
      url,
      images: image ? [{ url: image, alt: collection.title }] : undefined,
    },
  };
}

export async function renderCollection(collection: FabricCollection, page: number) {
  const all = await loadCollectionFabrics(collection);
  const pageCount = Math.max(1, Math.ceil(all.length / COLLECTION_PAGE_SIZE));
  if (!Number.isInteger(page) || page < 1 || page > pageCount) notFound();
  const fabrics = all.slice((page - 1) * COLLECTION_PAGE_SIZE, page * COLLECTION_PAGE_SIZE);

  // Colourway thumbnails: other colours of the same pattern within this collection.
  const shownGroups = new Set(fabrics.map((f) => f.colorwayGroup).filter(Boolean) as string[]);
  const colourways: Record<string, CardColourway[]> = {};
  for (const fabric of all) {
    if (!fabric.colorwayGroup || !shownGroups.has(fabric.colorwayGroup)) continue;
    (colourways[fabric.colorwayGroup] ||= []).push({ id: fabric.id, name: fabric.name, imageUrl: fabric.imageUrl });
  }

  const related = (collection.related || [])
    .filter((slug) => slug !== collection.slug)
    .map(getCollection)
    .filter(Boolean)
    .map((c) => toLink(c!));
  const groups = collectionGroups();

  const pageUrl = `${SITE_URL}${collectionHref(collection.slug, page)}`;
  const offset = (page - 1) * COLLECTION_PAGE_SIZE;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        url: pageUrl,
        name: collection.title,
        description: collection.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: all.length,
          itemListElement: fabrics.map((fabric, index) => ({
            '@type': 'ListItem',
            position: offset + index + 1,
            url: `${SITE_URL}/fabrics/${fabric.id}`,
            name: fabric.name,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Fabrics', item: `${SITE_URL}/fabrics` },
          { '@type': 'ListItem', position: 3, name: collection.label, item: `${SITE_URL}${collectionHref(collection.slug)}` },
        ],
      },
      ...(collection.faqs?.length && page === 1
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: collection.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <CollectionPage
        collection={collection}
        fabrics={fabrics}
        colourways={colourways}
        total={all.length}
        page={page}
        pageCount={pageCount}
        related={related}
        groups={groups}
      />
    </>
  );
}
