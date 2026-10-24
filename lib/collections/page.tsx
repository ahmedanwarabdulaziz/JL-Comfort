import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CollectionPage, { CollectionLink } from '@/components/collections/CollectionPage';
import type { CardColourway } from '@/components/fabrics/FabricCard';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { FabricCollection, collectionGroups, collectionUrl, comboCollections, getCollection } from './definitions';
import { publishedComboSlugs } from './catalogIndex';
import { COLLECTION_PAGE_SIZE, loadCollectionFabrics } from './server';
import { getGuide, guideHref, guidesForCollection } from '@/lib/guides';

// Guides about this collection first, topped up with the general ones so every collection links to some.
const GENERAL_GUIDES = ['how-to-choose-upholstery-fabric', 'how-much-fabric-do-i-need'];
const collectionGuides = (slug: string) => {
  const specific = guidesForCollection(slug);
  const general = GENERAL_GUIDES.map(getGuide).filter((g) => g && !specific.includes(g));
  return [...specific, ...general]
    .slice(0, Math.max(3, specific.length))
    .map((g) => ({ href: guideHref(g!.slug), title: g!.title }));
};

// Server side of a collection page, shared by /fabrics/<slug>, /fabrics/<slug>/page/<n> and the
// sample book pages under /sample-books.

// Links between a type, a colour and their colour + type pages ("Velvet by colour", "Grey fabric by
// type", "More velvet colours"), limited to the ones with enough fabrics to be published.
async function collectionVariants(collection: FabricCollection): Promise<{ heading: string; links: CollectionLink[] } | undefined> {
  const published = await publishedComboSlugs().catch(() => new Set<string>());
  const combos = comboCollections().filter((c) => published.has(c.slug));
  const link = (c: FabricCollection, label: string): CollectionLink => ({ slug: c.slug, label, group: c.group });
  const colourOf = (c: FabricCollection) => getCollection(c.comboOf!.colour)!.label;
  const parentOf = (c: FabricCollection) => getCollection(c.comboOf!.parent)!.label;
  if (collection.comboOf) {
    const siblings = combos.filter((c) => c.comboOf!.parent === collection.comboOf!.parent && c.slug !== collection.slug);
    return { heading: `More ${parentOf(collection).toLowerCase()} colours`, links: siblings.map((c) => link(c, colourOf(c))) };
  }
  if (collection.group === 'colour') {
    const types = combos.filter((c) => c.comboOf!.colour === collection.slug);
    return { heading: `${collection.label} fabric by type`, links: types.map((c) => link(c, parentOf(c))) };
  }
  const colours = combos.filter((c) => c.comboOf!.parent === collection.slug);
  return colours.length ? { heading: `${collection.label} by colour`, links: colours.map((c) => link(c, colourOf(c))) } : undefined;
}

const toLink = (collection: FabricCollection): CollectionLink => ({ slug: collection.slug, label: collection.label, group: collection.group });

export async function collectionMetadata(collection: FabricCollection, page: number): Promise<Metadata> {
  const url = collectionUrl(collection, page);
  const title = page > 1 ? `${collection.metaTitle} – Page ${page}` : collection.metaTitle;
  const fabrics = await loadCollectionFabrics(collection).catch(() => []);
  const image = fabrics[0]?.imageUrl;
  const hidden = collection.noindex || (collection.minFabrics != null && fabrics.length < collection.minFabrics);
  return {
    title,
    description: collection.description,
    alternates: { canonical: url },
    ...(hidden ? { robots: { index: false, follow: true } } : {}),
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
  // Generated colour + type pages only exist when there's enough to show.
  if (collection.minFabrics != null && all.length < collection.minFabrics) notFound();
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
  const variants = await collectionVariants(collection);

  const pageUrl = `${SITE_URL}${collectionUrl(collection, page)}`;
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
          { '@type': 'ListItem', position: 2, name: collection.parent?.label || 'Fabrics', item: `${SITE_URL}${collection.parent?.href || '/fabrics'}` },
          { '@type': 'ListItem', position: 3, name: collection.label, item: `${SITE_URL}${collectionUrl(collection)}` },
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
        guides={collectionGuides(collection.comboOf?.parent || collection.slug)}
        variants={variants}
      />
    </>
  );
}
