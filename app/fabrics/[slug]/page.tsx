import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import FabricDetailClient, { FabricDetailData, ColorwaySibling } from '@/components/fabrics/FabricDetailClient';

// ISR — matches the R2 catalog snapshot's own cache window (lib/data/charlotteFabricCatalog.ts),
// so a fabric page is never wildly stale relative to the rest of the site's fabric data.
export const revalidate = 1800;

// cache() dedupes this across generateMetadata and the page component within one request — without
// it, each page view reads Firestore twice (once for the title/description, once for the render).
const loadFabricDetail = cache(async (slug: string): Promise<FabricDetailData | null> => {
  const db = getAdminFirestore();
  // Distinct from "fabric not found" below: this means the server itself is misconfigured
  // (FIREBASE_SERVICE_ACCOUNT missing/invalid), which should surface as a real error rather than
  // silently rendering the same 404 a customer would see for a genuinely unknown SKU.
  if (!db) {
    throw new Error('Fabric detail page: getAdminFirestore() returned null — FIREBASE_SERVICE_ACCOUNT is missing or invalid in this environment.');
  }

  const doc = await db.collection('charlotteFabrics').doc(slug).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.status !== 'active') return null;

  const priceTagsSnap = await db.collection('fabricPriceTags').get();
  const priceTagsById = new Map(priceTagsSnap.docs.map((d) => [d.id, d.data() as { name?: string; pricePerYard?: number }]));
  const price = resolveEffectivePrice(
    { manualRetailPrice: data.manualRetailPrice, retailPrice: data.retailPrice, priceTagId: data.priceTagId },
    priceTagsById
  );

  let colorwaySiblings: ColorwaySibling[] = [];
  if (data.colorwayGroup) {
    const siblingsSnap = await db
      .collection('charlotteFabrics')
      .where('colorwayGroup', '==', data.colorwayGroup)
      .where('status', '==', 'active')
      .get();
    colorwaySiblings = siblingsSnap.docs
      .filter((d) => d.id !== doc.id)
      .map((d) => {
        const s = d.data();
        return { id: d.id, name: s.name || '', imageUrl: s.imageUrl || '', color: s.color || [] };
      });
  }

  return {
    id: doc.id,
    name: data.name || '',
    sku: data.sku || '',
    imageUrl: data.imageUrl || '',
    productUrl: data.productUrl || '',
    color: data.color || [],
    pattern: data.pattern || [],
    material: data.material || [],
    applications: data.applications || [],
    markets: data.markets || [],
    fiberContent: data.fiberContent || undefined,
    durability: data.durability || undefined,
    width: data.width || undefined,
    repeat: data.repeat || undefined,
    patternDirection: data.patternDirection || undefined,
    cleanability: data.cleanability || undefined,
    flammability: data.flammability || undefined,
    origin: data.origin || undefined,
    brand: data.brand || undefined,
    sampleBooks: data.sampleBooks || undefined,
    ecoFriendly: data.ecoFriendly || undefined,
    constructionType: data.constructionType || undefined,
    properties: data.properties || undefined,
    availability: data.availability || 'InStock',
    pricePerYard: price.pricePerYard,
    priceTagName: price.priceTagName,
    colorwaySiblings,
  };
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const fabric = await loadFabricDetail(params.slug);
    if (!fabric) return { title: 'Fabric Not Found' };
    return {
      title: `${fabric.name} — Fabric by the Yard`,
      description: `${fabric.name}${fabric.brand ? ` by ${fabric.brand}` : ''}. ${fabric.fiberContent || ''} Shop fabric by the yard at JL Comfort.`.trim(),
    };
  } catch {
    // Don't let a data-load error break metadata generation — the page component below surfaces
    // the real error visibly; this just needs to not crash first.
    return { title: 'Fabric' };
  }
}

export default async function FabricDetailPage({ params }: { params: { slug: string } }) {
  // A thrown error here (server misconfiguration) propagates to Next's error boundary as a real
  // 500 — intentionally not caught, so it stays visible in Vercel's function logs instead of
  // masquerading as a 404. Only a genuinely missing/inactive fabric reaches notFound() below.
  const fabric = await loadFabricDetail(params.slug);
  if (!fabric) notFound();

  return <FabricDetailClient fabric={fabric} />;
}
