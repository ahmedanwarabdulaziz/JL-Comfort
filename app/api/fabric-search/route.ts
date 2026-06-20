import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FabricItem } from '@/lib/types/fabric';
import { JL_COMFORT_FABRICS } from '@/lib/data/fabricDatabase';

// Color keyword mappings to Charlotte Fabrics URL filter parameters
const CHARLOTTE_COLOR_PARAMS: Record<string, string[]> = {
  Neutral: ['beige', 'grey', 'cream', 'ivory', 'taupe'],
  Warm: ['red', 'orange', 'brown', 'rust', 'coral', 'gold'],
  Cool: ['blue', 'teal', 'green', 'navy', 'sage', 'purple', 'aqua'],
  Bold: ['red', 'navy', 'purple', 'black'],
  Earth: ['brown', 'olive', 'rust', 'tan', 'terracotta'],
  Pastel: ['pink', 'lavender', 'cream', 'ivory', 'mint'],
  'Dark & Moody': ['black', 'navy', 'charcoal', 'espresso'],
  'Multi-Color': ['multi', 'blue', 'red'],
};

/**
 * Scrape fabric products from Charlotte Fabrics for a given color filter.
 * Parses their WooCommerce product listing HTML.
 */
async function scrapeCharlotteFabrics(colorParam: string): Promise<FabricItem[]> {
  const url = `https://www.charlottefabrics.com/product-category/fabric/?pa_fabric-color=${colorParam}&pa_use=upholstery`;

  try {
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
      console.error(`Charlotte Fabrics fetch failed: ${response.status} for color ${colorParam}`);
      return [];
    }

    const html = await response.text();
    return parseCharlotteFabricsHTML(html, colorParam);
  } catch (error) {
    console.error(`Error scraping Charlotte Fabrics for ${colorParam}:`, error);
    return [];
  }
}

/**
 * Parse HTML from Charlotte Fabrics product listing page.
 * Extracts: product name (aria-label), image URL, product URL.
 */
function parseCharlotteFabricsHTML(html: string, colorParam: string): FabricItem[] {
  const fabrics: FabricItem[] = [];

  // Match each product block using the product-images link pattern
  // Pattern: href="shop/..." class="product-images" aria-label="Product Name"
  const productLinkRegex =
    /href="(https:\/\/www\.charlottefabrics\.com\/shop\/[^"]+)"\s+class="product-images"\s+aria-label="([^"]+)"/g;

  // Extract all image URLs in order (300x300 thumbnails)
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

  // Match product links to images (they appear in the same order in the HTML)
  productLinks.forEach((product, index) => {
    if (!product.name || !product.url) return;

    const imageUrl = imageUrls[index] || '';

    fabrics.push({
      id: `cf-${product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      name: product.name.trim(),
      imageUrl,
      color: [colorParam],
      style: [],
      fabricType: 'Upholstery',
      source: 'charlotte-fabrics',
      productUrl: product.url,
      price: 'See website',
      description: `Premium upholstery fabric from Charlotte Fabrics. ${product.name} in ${colorParam} tones.`,
      tags: ['charlotte-fabrics', 'upholstery', colorParam],
    });
  });

  return fabrics;
}

/**
 * Use Gemini to rank and select the top 5 fabrics based on furniture image + preferences.
 */
async function rankFabricsWithGemini(
  fabrics: FabricItem[],
  style: string,
  colors: string[],
  fabricType: string,
  furnitureImageBase64: string,
  furnitureMimeType: string
): Promise<FabricItem[]> {
  if (!process.env.GEMINI_API_KEY) {
    // No API key: return first 5 fabrics
    return fabrics.slice(0, 5);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build fabric list for Gemini
    const fabricList = fabrics
      .slice(0, 25) // limit to 25 candidates
      .map((f, i) => `${i}: [${f.id}] "${f.name}" — Type: ${f.fabricType}, Colors: ${f.color.join(', ')}, Source: ${f.source}`)
      .join('\n');

    const prompt = `You are an expert interior designer and fabric consultant.

I have a customer who has uploaded a photo of their furniture (attached below). 
They want to reupholster it with new fabric matching these preferences:
- Style: ${style || 'Any'}
- Color palette: ${colors.join(', ') || 'Any'}
- Fabric type: ${fabricType || 'Any'}

Here are the available fabric options (indexed 0 to ${Math.min(fabrics.length, 25) - 1}):
${fabricList}

Looking at the furniture in the image and the customer's preferences, select the BEST 5 fabrics that would look stunning on this specific piece. 

Respond ONLY with a valid JSON array of exactly 5 objects in this format:
[
  { "id": "fabric-id-here", "reason": "Brief 1-sentence reason why this fabric is perfect for this piece" },
  ...
]

Choose based on: furniture style compatibility, color harmony, fabric durability for the furniture type, and overall aesthetic impact. Return only the JSON array, no other text.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: furnitureMimeType as 'image/jpeg' | 'image/png' | 'image/webp',
          data: furnitureImageBase64,
        },
      },
    ]);

    const responseText = result.response.text().trim();

    // Parse JSON from Gemini response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in Gemini response');

    const ranked: Array<{ id: string; reason: string }> = JSON.parse(jsonMatch[0]);

    // Map ranked IDs back to fabric items with reasons
    const rankedFabrics: FabricItem[] = [];
    for (const item of ranked) {
      const fabric = fabrics.find((f) => f.id === item.id);
      if (fabric) {
        rankedFabrics.push({ ...fabric, geminiReason: item.reason });
      }
    }

    // Ensure we have exactly 5 (fill from remaining if Gemini returned fewer)
    if (rankedFabrics.length < 5) {
      const usedIds = new Set(rankedFabrics.map((f) => f.id));
      for (const fabric of fabrics) {
        if (rankedFabrics.length >= 5) break;
        if (!usedIds.has(fabric.id)) {
          rankedFabrics.push(fabric);
          usedIds.add(fabric.id);
        }
      }
    }

    return rankedFabrics.slice(0, 5);
  } catch (error) {
    console.error('Gemini ranking error:', error);
    // Fallback: return first 5 fabrics
    return fabrics.slice(0, 5);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      style = '',
      colors = [],
      fabricType = '',
      furnitureImageBase64,
      furnitureMimeType = 'image/jpeg',
    } = body;

    // 1. Determine which Charlotte Fabrics color params to scrape
    const charlotteColorParams = new Set<string>();
    if (colors.length > 0) {
      for (const color of colors) {
        const params = CHARLOTTE_COLOR_PARAMS[color] || [];
        // Pick first 2 color params per selected preference to avoid too many requests
        params.slice(0, 2).forEach((p) => charlotteColorParams.add(p));
      }
    } else {
      // Default to popular neutral colors
      ['beige', 'grey', 'blue'].forEach((p) => charlotteColorParams.add(p));
    }

    // 2. Scrape Charlotte Fabrics (limit to 2 colors to stay fast)
    const colorParamsToFetch = Array.from(charlotteColorParams).slice(0, 2);
    const charlotteFabricArrays = await Promise.allSettled(
      colorParamsToFetch.map((color) => scrapeCharlotteFabrics(color))
    );

    let charlotteFabrics: FabricItem[] = [];
    for (const result of charlotteFabricArrays) {
      if (result.status === 'fulfilled') {
        charlotteFabrics = [...charlotteFabrics, ...result.value];
      }
    }

    // De-duplicate Charlotte Fabrics results by product URL
    const seenUrls = new Set<string>();
    charlotteFabrics = charlotteFabrics.filter((f) => {
      if (!f.productUrl || seenUrls.has(f.productUrl)) return false;
      seenUrls.add(f.productUrl);
      return true;
    });

    // 3. Filter JL Comfort fabrics by preferences
    const colorLower = colors.map((c: string) => c.toLowerCase());
    const styleLower = style.toLowerCase();
    const typeLower = fabricType.toLowerCase();

    const jlFabrics = JL_COMFORT_FABRICS.filter((fabric) => {
      const styleMatch =
        !style ||
        fabric.style.some(
          (s) => s.toLowerCase() === styleLower || s.toLowerCase().includes(styleLower)
        );
      const colorMatch =
        !colors.length ||
        colorLower.some((c: string) =>
          fabric.color.some(
            (fc) => fc.toLowerCase().includes(c) || c.includes(fc.toLowerCase())
          )
        );
      const typeMatch =
        !fabricType ||
        fabric.fabricType.toLowerCase().includes(typeLower) ||
        typeLower.includes(fabric.fabricType.toLowerCase());
      return styleMatch && colorMatch && typeMatch;
    });

    // 4. Merge all fabrics (Charlotte Fabrics first, then JL Comfort)
    const allFabrics = [...charlotteFabrics.slice(0, 15), ...jlFabrics.slice(0, 10)];

    if (allFabrics.length === 0) {
      // Last resort: return all JL Comfort fabrics
      return NextResponse.json({ fabrics: JL_COMFORT_FABRICS.slice(0, 5) });
    }

    // 5. Rank with Gemini if furniture image + API key available
    let finalFabrics: FabricItem[];
    if (furnitureImageBase64 && process.env.GEMINI_API_KEY) {
      finalFabrics = await rankFabricsWithGemini(
        allFabrics,
        style,
        colors,
        fabricType,
        furnitureImageBase64,
        furnitureMimeType
      );
    } else {
      // No Gemini: return first 5 from merged list
      finalFabrics = allFabrics.slice(0, 5);
    }

    return NextResponse.json({ fabrics: finalFabrics });
  } catch (error) {
    console.error('Fabric search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search fabrics', fabrics: JL_COMFORT_FABRICS.slice(0, 5) },
      { status: 500 }
    );
  }
}
