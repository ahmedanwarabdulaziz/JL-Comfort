import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FabricItem } from '@/lib/types/fabric';
import { CharlotteFabric } from '@/lib/types/charlotteFabric';
import { JL_COMFORT_FABRICS } from '@/lib/data/fabricDatabase';
import { getCharlotteFabricsSnapshot } from '@/lib/data/charlotteFabricCatalog';

// Style/color preference keywords mapped to the synced catalog's color facet values
// (lib/data/charlotteFabricFacets.ts). Used to filter the pre-synced snapshot instead of
// live-scraping charlottefabrics.com per request.
const CHARLOTTE_COLOR_PARAMS: Record<string, string[]> = {
  Neutral: ['beige-taupe', 'grey-silver', 'white-ivory'],
  Warm: ['red-burgundy', 'orange-rust', 'gold-yellow', 'coral-peach'],
  Cool: ['blue', 'aqua-teal', 'green', 'purple'],
  Bold: ['red-burgundy', 'blue', 'purple', 'black'],
  Earth: ['brown', 'orange-rust', 'gold-yellow'],
  Pastel: ['pink', 'coral-peach', 'white-ivory'],
  'Dark & Moody': ['black', 'brown', 'grey-silver'],
  'Multi-Color': ['blue', 'red-burgundy', 'green'],
};

/** Maps a synced catalog entry to the shape the rest of this route (and the gallery) works with. */
function toFabricItem(fabric: CharlotteFabric): FabricItem {
  return {
    id: fabric.id,
    name: fabric.name,
    imageUrl: fabric.imageUrl,
    color: fabric.color,
    style: fabric.pattern,
    fabricType: fabric.material[0] || 'Upholstery',
    source: 'charlotte-fabrics',
    productUrl: fabric.productUrl,
    price: 'See website',
    description: `Premium upholstery fabric from Charlotte Fabrics. ${fabric.name}.`,
    tags: ['charlotte-fabrics', ...fabric.color, ...fabric.pattern, ...fabric.material],
  };
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

    // 1. Determine which catalog color facet values match the requested preferences
    const matchedColorValues = new Set<string>();
    if (colors.length > 0) {
      for (const color of colors) {
        (CHARLOTTE_COLOR_PARAMS[color] || []).forEach((v) => matchedColorValues.add(v));
      }
    } else {
      // Default to popular neutral/blue tones
      CHARLOTTE_COLOR_PARAMS.Neutral.forEach((v) => matchedColorValues.add(v));
      matchedColorValues.add('blue');
    }

    // 2. Filter the pre-synced catalog snapshot in-memory — no live scraping, no per-request
    // Firestore reads (see lib/data/charlotteFabricCatalog.ts's getCharlotteFabricsSnapshot).
    const snapshot = await getCharlotteFabricsSnapshot();
    const charlotteFabrics: FabricItem[] = snapshot
      .filter((fabric) => fabric.color.some((c) => matchedColorValues.has(c)))
      .map(toFabricItem);

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
