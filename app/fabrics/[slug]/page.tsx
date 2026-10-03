import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import { getFabricPriceTags } from '@/lib/data/fabricPriceTags';
import FabricDetailClient, { FabricDetailData, ColorwaySibling } from '@/components/fabrics/FabricDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { describeFabric } from '@/lib/seo/fabric';
import { collectionsForFabric, fabricKeywords, FabricTags, getCollection } from '@/lib/collections/definitions';
import FabricCollectionLinks from '@/components/collections/FabricCollectionLinks';
import { collectionMetadata, renderCollection } from '@/lib/collections/page';

// ISR — matches the R2 catalog snapshot's own cache window (lib/data/charlotteFabricCatalog.ts),
// so a fabric page is never wildly stale relative to the rest of the site's fabric data.
export const revalidate = 1800;

// cache() dedupes this across generateMetadata and the page component within one request — without
// it, each page view reads the database twice (once for the title/description, once for the render).
const loadFabricDetail = cache(async (slug: string): Promise<FabricDetailData | null> => {
  const supabase = await createSupabaseServerClient();
  // Distinct from "fabric not found" below: this means the server itself is misconfigured
  // (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY missing/invalid), which should surface as a real error
  // rather than silently rendering the same 404 a customer would see for a genuinely unknown SKU.
  if (!supabase) {
    throw new Error('Fabric detail page: Supabase is not configured — NEXT_PUBLIC_SUPABASE_URL/ANON_KEY missing or invalid in this environment.');
  }

  // Fabric lookup and price tags don't depend on each other -- fetch them in parallel rather
  // than sequentially, since each is a separate network round-trip to Supabase.
  const [{ data, error }, priceTags] = await Promise.all([
    supabase.from('charlotte_fabrics').select('*').eq('legacy_id', slug).maybeSingle(),
    getFabricPriceTags(),
  ]);
  if (error) throw error;
  if (!data || data.status !== 'active') return null;

  const priceTagsById = new Map(priceTags.map((tag) => [tag.id, { name: tag.name, pricePerYard: tag.pricePerYard }]));
  const price = resolveEffectivePrice(
    { manualRetailPrice: data.manual_retail_price, retailPrice: data.retail_price, priceTagId: data.price_tag_id },
    priceTagsById
  );

  let colorwaySiblings: ColorwaySibling[] = [];
  if (data.colorway_group) {
    const { data: siblingRows, error: siblingsError } = await supabase
      .from('charlotte_fabrics')
      .select('legacy_id, name, image_url, color')
      .eq('colorway_group', data.colorway_group)
      .eq('status', 'active')
      .neq('id', data.id);
    if (siblingsError) throw siblingsError;
    colorwaySiblings = (siblingRows || []).map((s) => ({
      // ColorwaySibling.id is used to build the /fabrics/[slug] link, so this must be the
      // legacy_id slug, not the row's uuid primary key (they diverged in the Supabase migration --
      // under Firestore the doc id and the slug were the same value).
      id: s.legacy_id,
      name: s.name || '',
      imageUrl: s.image_url || '',
      color: s.color || [],
    }));
  }

  return {
    id: data.id,
    name: data.name || '',
    sku: data.sku || '',
    imageUrl: data.image_url || '',
    productUrl: data.product_url || '',
    color: data.color || [],
    pattern: data.pattern || [],
    material: data.material || [],
    applications: data.applications || [],
    markets: data.markets || [],
    fiberContent: data.fiber_content || undefined,
    durability: data.durability || undefined,
    width: data.width || undefined,
    repeat: data.repeat || undefined,
    patternDirection: data.pattern_direction || undefined,
    cleanability: data.cleanability || undefined,
    flammability: data.flammability || undefined,
    origin: data.origin || undefined,
    features: data.features || undefined,
    performance: data.performance || undefined,
    brand: data.brand || undefined,
    sampleBooks: data.sample_books || undefined,
    ecoFriendly: data.eco_friendly || undefined,
    constructionType: data.construction_type || undefined,
    properties: data.properties || undefined,
    availability: data.availability || 'InStock',
    pricePerYard: price.pricePerYard,
    priceTagName: price.priceTagName,
    colorwaySiblings,
  };
});

const tagsOf = (fabric: FabricDetailData): FabricTags => ({
  material: fabric.material,
  pattern: fabric.pattern,
  color: fabric.color,
  properties: fabric.properties,
  markets: fabric.markets,
  applications: fabric.applications,
  cleanability: fabric.cleanability,
  durability: fabric.durability,
});

// /fabrics/<slug> is either a collection landing page (/fabrics/velvet) or a single fabric
// (/fabrics/d2215-sky). Collection slugs are letters only and fabric slugs always contain their
// pattern number, so the two can never collide.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = getCollection(params.slug);
  if (collection) return collectionMetadata(collection, 1);
  try {
    const fabric = await loadFabricDetail(params.slug);
    if (!fabric) return { title: 'Fabric Not Found', robots: { index: false } };
    // "D2215 Sky – Grey Textured Upholstery Fabric": the code alone is not what people search for.
    const keywords = fabricKeywords(tagsOf(fabric));
    const title = `${fabric.name} – ${keywords ? `${keywords} ` : ''}Upholstery Fabric`;
    const description = describeFabric({ ...fabric, keywords });
    const url = `/fabrics/${params.slug}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        locale: 'en_CA',
        title,
        description,
        url,
        images: fabric.imageUrl ? [{ url: fabric.imageUrl, alt: fabric.name }] : undefined,
      },
    };
  } catch {
    // Don't let a data-load error break metadata generation — the page component below surfaces
    // the real error visibly; this just needs to not crash first.
    return { title: 'Fabric' };
  }
}

// schema.org Product, so Google can show price and stock in search results and Merchant Center
// can match this page to the product feed. The id matches what the ad pixels report.
function productJsonLd(fabric: FabricDetailData, slug: string) {
  const url = `${SITE_URL}/fabrics/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: fabric.name,
    sku: fabric.sku || fabric.id,
    url,
    image: fabric.imageUrl ? [fabric.imageUrl] : undefined,
    description: describeFabric({ ...fabric, keywords: fabricKeywords(tagsOf(fabric)) }),
    brand: { '@type': 'Brand', name: SITE_NAME },
    material: fabric.fiberContent,
    offers:
      fabric.pricePerYard != null
        ? {
            '@type': 'Offer',
            url,
            priceCurrency: 'CAD',
            price: fabric.pricePerYard.toFixed(2),
            availability: `https://schema.org/${fabric.availability === 'InStock' ? 'InStock' : 'OutOfStock'}`,
            itemCondition: 'https://schema.org/NewCondition',
            // Cut to order, so no change-of-mind returns (defects are still covered; see /terms).
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'CA',
              returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
            },
            seller: { '@id': `${SITE_URL}/#organization` },
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: fabric.pricePerYard.toFixed(2),
              priceCurrency: 'CAD',
              unitCode: 'YRD',
              unitText: 'yard',
            },
          }
        : undefined,
  };
}

export default async function FabricDetailPage({ params }: { params: { slug: string } }) {
  const collection = getCollection(params.slug);
  if (collection) return renderCollection(collection, 1);

  // A thrown error here (server misconfiguration) propagates to Next's error boundary as a real
  // 500 — intentionally not caught, so it stays visible in the logs instead of masquerading as a
  // 404. Only a genuinely missing/inactive fabric reaches notFound() below.
  const fabric = await loadFabricDetail(params.slug);
  if (!fabric) notFound();
  const collections = collectionsForFabric(tagsOf(fabric));
  const primaryCollection = collections.find((c) => c.group === 'type');

  return (
    <>
      <JsonLd data={productJsonLd(fabric, params.slug)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Fabrics', item: `${SITE_URL}/fabrics` },
            ...(primaryCollection
              ? [{ '@type': 'ListItem', position: 3, name: primaryCollection.label, item: `${SITE_URL}/fabrics/${primaryCollection.slug}` }]
              : []),
            { '@type': 'ListItem', position: primaryCollection ? 4 : 3, name: fabric.name, item: `${SITE_URL}/fabrics/${params.slug}` },
          ],
        }}
      />
      <FabricDetailClient fabric={fabric} />
      <FabricCollectionLinks links={collections.map((c) => ({ slug: c.slug, label: c.label }))} />
    </>
  );
}
