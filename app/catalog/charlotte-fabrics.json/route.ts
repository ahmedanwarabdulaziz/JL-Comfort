import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, r2Config, isR2Configured } from '@/lib/cloudflare/r2';

// The storefront's fabric catalog snapshot (published to R2 by scripts/sync-charlotte-fabrics.js and
// Admin -> Fabric Pricing), served from our own domain. The public pub-*.r2.dev address is
// rate-limited by Cloudflare and took 4-24s to download, which left /fabrics on "Loading fabrics...";
// here Vercel's CDN keeps a copy at the edge, so visitors get it in well under a second.
// Not under /api/: robots.txt blocks that, and Googlebot needs this file to render /fabrics.
export const dynamic = 'force-dynamic';

const SNAPSHOT_R2_KEY = 'catalog/charlotte-fabrics.json';

// Edge copy refreshes every 5 minutes (a publish shows up within that), and a stale copy is served
// while it does, so no visitor waits on R2.
const CACHE_CONTROL = 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400';

export async function GET() {
  const publicUrl = `${r2Config.publicUrl}/${SNAPSHOT_R2_KEY}`;
  if (!isR2Configured()) return Response.redirect(publicUrl, 307);

  try {
    // The object is stored gzipped (Content-Encoding: gzip); pass those bytes through untouched
    // rather than inflating them to the ~6-10MB JSON, which is over Vercel's response size limit.
    const object = await r2Client.send(new GetObjectCommand({ Bucket: r2Config.bucketName, Key: SNAPSHOT_R2_KEY }));
    if (!object.Body) throw new Error('Empty catalog snapshot');
    const body = await object.Body.transformToByteArray();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': CACHE_CONTROL };
    if (object.ContentEncoding) headers['Content-Encoding'] = object.ContentEncoding;
    return new Response(Buffer.from(body), { headers });
  } catch (error) {
    console.error('Catalog snapshot: could not read from R2, redirecting to the public URL', error);
    return Response.redirect(publicUrl, 307);
  }
}
