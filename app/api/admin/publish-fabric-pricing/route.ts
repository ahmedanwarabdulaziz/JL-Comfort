import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import zlib from 'zlib';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { r2Client, r2Config, isR2Configured } from '@/lib/cloudflare/r2';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';

// Same key/cache window as scripts/sync-charlotte-fabrics.js's publishSnapshot — this route is a
// fast alternative to a full sync when nothing needs re-crawling from charlottefabrics.com, only
// this app's own price tag/group assignments have changed. Firestore reads here use the admin SDK
// (bypasses security rules) since this route already verifies the caller is an authenticated admin.
const SNAPSHOT_R2_KEY = 'catalog/charlotte-fabrics.json';
const SNAPSHOT_CACHE_CONTROL = 'public, max-age=1800';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { error: 'Server is not configured to verify admin requests (FIREBASE_SERVICE_ACCOUNT missing).' },
      { status: 500 }
    );
  }

  try {
    await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: 'Server is not configured (FIREBASE_SERVICE_ACCOUNT missing).' }, { status: 500 });
  }
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'Server is not configured (Cloudflare R2 env vars missing).' }, { status: 500 });
  }

  try {
    const toIso = (ts: FirebaseFirestore.Timestamp | undefined) => (ts ? ts.toDate().toISOString() : null);

    const priceTagsSnapshot = await db.collection('fabricPriceTags').get();
    const priceTagsById = new Map(priceTagsSnapshot.docs.map((d) => [d.id, d.data() as { name?: string; pricePerYard?: number }]));

    const activeSnapshot = await db.collection('charlotteFabrics').where('status', '==', 'active').get();
    const allItems = activeSnapshot.docs.map((doc) => {
      const data = doc.data();
      const effectivePrice = resolveEffectivePrice(
        { manualRetailPrice: data.manualRetailPrice, retailPrice: data.retailPrice, priceTagId: data.priceTagId },
        priceTagsById
      );
      return {
        id: doc.id,
        name: data.name || '',
        sku: data.sku || '',
        productUrl: data.productUrl || '',
        imageUrl: data.imageUrl || '',
        imageOk: data.imageOk ?? true,
        color: data.color || [],
        pattern: data.pattern || [],
        material: data.material || [],
        applications: data.applications || [],
        markets: data.markets || [],
        fiberContent: data.fiberContent || '',
        durability: data.durability || '',
        width: data.width || '',
        repeat: data.repeat || '',
        patternDirection: data.patternDirection || '',
        cleanability: data.cleanability || '',
        flammability: data.flammability || '',
        origin: data.origin || '',
        features: data.features || '',
        performance: data.performance || '',
        availability: data.availability || 'InStock',
        status: data.status || 'active',
        firstSeenAt: toIso(data.firstSeenAt),
        lastSeenAt: toIso(data.lastSeenAt),
        lastCheckedAt: toIso(data.lastCheckedAt),
        priceTagId: data.priceTagId || null,
        groupIds: data.groupIds || [],
        pricePerYard: effectivePrice.pricePerYard,
        priceTagName: effectivePrice.priceTagName,
      };
    });

    // No fallback pricing, and unpriced items never reach customers — same rule as the full sync.
    const items = allItems.filter((item) => item.pricePerYard != null);
    const unpricedCount = allItems.length - items.length;

    const gzipped = zlib.gzipSync(JSON.stringify(items));

    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: SNAPSHOT_R2_KEY,
        Body: gzipped,
        ContentType: 'application/json',
        ContentEncoding: 'gzip',
        CacheControl: SNAPSHOT_CACHE_CONTROL,
      })
    );

    return NextResponse.json({ published: items.length, unpriced: unpricedCount });
  } catch (error) {
    console.error('Error publishing fabric pricing snapshot:', error);
    return NextResponse.json({ error: 'Failed to publish pricing.' }, { status: 500 });
  }
}
