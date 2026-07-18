import { NextRequest, NextResponse } from 'next/server';
import { FabricItem } from '@/lib/types/fabric';

// Charlotte Fabrics renders 48 products per page of /product-category/fabric/.
// Used as a heuristic: a full page suggests more results may exist on the next page.
const PAGE_SIZE = 48;

/**
 * Parse fabric products out of a Charlotte Fabrics product listing page.
 * Same HTML shape/regex approach as the color-only scraper in /api/fabric-search.
 */
function parseCharlotteFabricsHTML(
  html: string,
  meta: { color: string; pattern: string; material: string }
): FabricItem[] {
  const fabrics: FabricItem[] = [];

  const productLinkRegex =
    /href="(https:\/\/www\.charlottefabrics\.com\/shop\/[^"]+)"\s+class="product-images"\s+aria-label="([^"]+)"/g;

  const imageUrlRegex =
    /src="(https:\/\/www\.charlottefabrics\.com\/wp-content\/uploads\/[^"]+(?:300x300|400x400|600x600)[^"]*\.(?:jpg|jpeg|png|webp))"/g;

  const productLinks: Array<{ url: string; name: string }> = [];
  let linkMatch;
  while ((linkMatch = productLinkRegex.exec(html)) !== null) {
    productLinks.push({ url: linkMatch[1], name: linkMatch[2] });
  }

  const imageUrls: string[] = [];
  let imgMatch;
  while ((imgMatch = imageUrlRegex.exec(html)) !== null) {
    imageUrls.push(imgMatch[1]);
  }

  productLinks.forEach((product, index) => {
    if (!product.name || !product.url) return;

    const imageUrl = imageUrls[index] || '';
    const tags = ['charlotte-fabrics'];
    if (meta.color) tags.push(meta.color);
    if (meta.pattern) tags.push(meta.pattern);
    if (meta.material) tags.push(meta.material);

    fabrics.push({
      id: `cf-${product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      name: product.name.trim(),
      imageUrl,
      color: meta.color ? [meta.color] : [],
      style: meta.pattern ? [meta.pattern] : [],
      fabricType: meta.material || 'Upholstery',
      source: 'charlotte-fabrics',
      productUrl: product.url,
      price: 'See website',
      description: `Premium upholstery fabric from Charlotte Fabrics. ${product.name}.`,
      tags,
    });
  });

  return fabrics;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const color = searchParams.get('color') || '';
    const pattern = searchParams.get('pattern') || '';
    const material = searchParams.get('material') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

    const filterParams = new URLSearchParams();
    if (color) filterParams.set('_color', color);
    if (pattern) filterParams.set('_pattern', pattern);
    if (material) filterParams.set('_material', material);

    const basePath =
      page > 1
        ? `https://www.charlottefabrics.com/product-category/fabric/page/${page}/`
        : `https://www.charlottefabrics.com/product-category/fabric/`;
    const queryString = filterParams.toString();
    const url = queryString ? `${basePath}?${queryString}` : basePath;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      // Treat upstream failure as "no more results" rather than a hard error,
      // since this only affects the browsing gallery, not a critical path.
      return NextResponse.json({ fabrics: [], hasMore: false, page });
    }

    const html = await response.text();
    const fabrics = parseCharlotteFabricsHTML(html, { color, pattern, material });

    return NextResponse.json({
      fabrics,
      hasMore: fabrics.length >= PAGE_SIZE,
      page,
    });
  } catch (error) {
    console.error('Fabric catalog API error:', error);
    return NextResponse.json({ fabrics: [], hasMore: false, error: 'Failed to fetch fabrics' });
  }
}
