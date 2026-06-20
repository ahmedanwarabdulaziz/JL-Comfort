import { NextRequest, NextResponse } from 'next/server';
import { FabricItem } from '@/lib/types/fabric';

const BASE = 'https://generativelanguage.googleapis.com';

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return {
      base64: Buffer.from(buffer).toString('base64'),
      mimeType: (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim(),
    };
  } catch {
    return null;
  }
}

function extractImageFromParts(parts: any[]): { base64: string; mimeType: string } | null {
  for (const part of parts) {
    if (part?.inline_data?.data) {
      return { base64: part.inline_data.data, mimeType: part.inline_data.mime_type || 'image/png' };
    }
    if (part?.inlineData?.data) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
    }
  }
  return null;
}

/**
 * Single attempt: POST to a Gemini model endpoint.
 * Returns image data on success, null on 404, or { error } on other failures.
 */
async function tryModel(
  apiKey: string,
  modelName: string,
  parts: any[],
  modalities: string[] | null
): Promise<{ base64: string; mimeType: string } | { error: string } | null> {
  const url = `${BASE}/v1beta/models/${modelName}:generateContent`;

  const body: any = { contents: [{ role: 'user', parts }] };
  if (modalities) {
    body.generationConfig = { responseModalities: modalities };
  }

  console.log(`[ai-visualize] → ${modelName} | modalities=${JSON.stringify(modalities)}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { error: `Network error: ${e}` };
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    return { error: `HTTP ${res.status} (no JSON body)` };
  }

  if (!res.ok) {
    const msg: string = data?.error?.message || `HTTP ${res.status}`;
    console.warn(`[ai-visualize]   ✗ ${res.status}: ${msg.slice(0, 120)}`);
    if (res.status === 404) return null;
    if (res.status === 429) return { error: `QUOTA_EXCEEDED: ${msg}` };
    return { error: msg };
  }

  const candidates = data?.candidates || [];
  for (const candidate of candidates) {
    const imgData = extractImageFromParts(candidate?.content?.parts || []);
    if (imgData) {
      console.log(`[ai-visualize]   ✅ Image found! mimeType=${imgData.mimeType}`);
      return imgData;
    }
  }

  const finishReason = candidates[0]?.finishReason;
  const blockReason = data?.promptFeedback?.blockReason;
  const partKeys = candidates[0]?.content?.parts?.map((p: Record<string, unknown>) => Object.keys(p));

  console.warn(`[ai-visualize]   ⚠ No image. finish=${finishReason} block=${blockReason} partKeys=${JSON.stringify(partKeys)}`);

  const textPart = candidates[0]?.content?.parts?.find((p: any) => p.text);
  if (textPart) console.warn(`[ai-visualize]   Text returned: ${textPart.text?.slice(0, 200)}`);

  if (finishReason === 'SAFETY' || blockReason) {
    return { error: 'Blocked by safety filters. Try a clearer furniture photo.' };
  }

  return null;
}

// Confirmed available image generation models for this API key
const IMAGE_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image',
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image',
  'nano-banana-pro-preview',
];

const MODALITY_CONFIGS: Array<string[] | null> = [
  null,
  ['TEXT', 'IMAGE'],
  ['IMAGE', 'TEXT'],
  ['IMAGE'],
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      furnitureImageBase64,
      furnitureMimeType = 'image/jpeg',
      fabric,
    }: { furnitureImageBase64: string; furnitureMimeType: string; fabric: FabricItem } = body;

    if (!furnitureImageBase64 || !fabric) {
      return NextResponse.json({ error: 'Missing furniture image or fabric data' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // ── Build parts ───────────────────────────────────────────────────────────

    const parts: any[] = [];

    const prompt = `You are a professional interior design AI specializing in furniture reupholstery visualization.

TASK: Generate a photorealistic image of the furniture in the attached photo with its upholstery completely replaced by new fabric.

NEW FABRIC:
- Name: ${fabric.name}
- Type: ${fabric.fabricType}
- Colors: ${fabric.color.join(', ')}
- Style: ${fabric.style.join(', ')}
${fabric.description ? `- Description: ${fabric.description}` : ''}

RULES:
1. Keep the EXACT same furniture shape, frame, legs, and proportions
2. Keep the EXACT same room background, lighting, and shadows
3. ONLY change the upholstery/fabric — nothing else
4. Realistic fabric folds, texture, highlights
5. Same camera angle and perspective
${fabric.imageUrl ? '6. Second image = fabric swatch — match its color and texture exactly' : `6. Fabric: ${fabric.color.join(' and ')} colored ${fabric.fabricType.toLowerCase()}`}

Output a single photorealistic result image.`;

    parts.push({ text: prompt });
    parts.push({ inline_data: { mime_type: furnitureMimeType, data: furnitureImageBase64 } });

    if (fabric.imageUrl?.startsWith('http')) {
      const swatchImg = await fetchImageAsBase64(fabric.imageUrl);
      if (swatchImg) {
        parts.push({ inline_data: { mime_type: swatchImg.mimeType, data: swatchImg.base64 } });
        console.log('[ai-visualize] Swatch image attached');
      }
    }

    // ── Systematic attempt matrix ─────────────────────────────────────────────

    let lastError = '';

    for (const modelName of IMAGE_MODELS) {
      for (const modalities of MODALITY_CONFIGS) {
        const result = await tryModel(apiKey, modelName, parts, modalities);

        if (result === null) continue;

        if ('error' in result) {
          lastError = result.error;

          if (result.error.startsWith('QUOTA_EXCEEDED')) {
            console.error('[ai-visualize] Billing required for image generation.');
            return NextResponse.json({
              error: 'BILLING_REQUIRED',
              message: 'AI image generation requires billing to be enabled on your Google Cloud project.',
              billingUrl: 'https://console.cloud.google.com/billing',
              projectId: '133932755920',
            }, { status: 402 });
          }

          if (result.error.toLowerCase().includes('safety') || result.error.toLowerCase().includes('blocked')) {
            return NextResponse.json({ error: result.error }, { status: 422 });
          }

          break; // skip to next model
        }

        // ✅ Success
        return NextResponse.json({
          visualizedImageBase64: result.base64,
          mimeType: result.mimeType,
          modelUsed: modelName,
        });
      }
    }

    console.error('[ai-visualize] All models exhausted. Last error:', lastError);
    return NextResponse.json(
      { error: lastError || 'No image generation model returned an image. Check server logs.' },
      { status: 422 }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ai-visualize] Exception:', message);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
