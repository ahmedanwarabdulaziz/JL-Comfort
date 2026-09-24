import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import zlib from 'zlib';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { r2Client, r2Config, isR2Configured } from '@/lib/cloudflare/r2';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';

// Same key/cache window as scripts/sync-charlotte-fabrics.js's publishSnapshot — this route is a
// fast alternative to a full sync when nothing needs re-crawling from charlottefabrics.com, only
// this app's own price tag/group assignments have changed. Auth is enforced entirely by
// middleware.ts (matcher covers /api/admin/:path*) before this handler ever runs.
const SNAPSHOT_R2_KEY = 'catalog/charlotte-fabrics.json';
const SNAPSHOT_CACHE_CONTROL = 'public, max-age=1800';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server is not configured (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY missing).' },
      { status: 500 }
    );
  }
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'Server is not configured (Cloudflare R2 env vars missing).' }, { status: 500 });
  }

  try {
    const { data: priceTagRows, error: priceTagsError } = await supabase
      .from('fabric_price_tags')
      .select('id, name, price_per_yard');
    if (priceTagsError) throw priceTagsError;

    const priceTagsById = new Map(
      (priceTagRows || []).map((tag) => [tag.id, { name: tag.name, pricePerYard: tag.price_per_yard }])
    );

    // Must page through — a plain select is silently capped at 1000 rows by PostgREST, which used to
    // truncate this snapshot to the first 1000 of ~7000 fabrics (see fetchAllRows).
    const fabricRows = await fetchAllRows<any>(() =>
      supabase.from('charlotte_fabrics').select('*, fabric_group_members(group_id)').eq('status', 'active')
    );

    const allItems = fabricRows.map((data) => {
      const effectivePrice = resolveEffectivePrice(
        {
          manualRetailPrice: data.manual_retail_price,
          retailPrice: data.retail_price,
          priceTagId: data.price_tag_id,
        },
        priceTagsById
      );
      return {
        id: data.legacy_id,
        name: data.name || '',
        sku: data.sku || '',
        productUrl: data.product_url || '',
        imageUrl: data.image_url || '',
        imageOk: data.image_ok ?? true,
        color: data.color || [],
        pattern: data.pattern || [],
        material: data.material || [],
        applications: data.applications || [],
        markets: data.markets || [],
        fiberContent: data.fiber_content || '',
        durability: data.durability || '',
        width: data.width || '',
        repeat: data.repeat || '',
        patternDirection: data.pattern_direction || '',
        cleanability: data.cleanability || '',
        flammability: data.flammability || '',
        origin: data.origin || '',
        features: data.features || '',
        performance: data.performance || '',
        availability: data.availability || 'InStock',
        status: data.status || 'active',
        firstSeenAt: data.first_seen_at,
        lastSeenAt: data.last_seen_at,
        lastCheckedAt: data.last_checked_at,
        priceTagId: data.price_tag_id || null,
        groupIds: (data.fabric_group_members || []).map((m: { group_id: string }) => m.group_id),
        sampleBooks: data.sample_books || [],
        colorwayGroup: data.colorway_group || null, // shop cards show other colourways of the pattern
        isNew: !!data.is_new,
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
