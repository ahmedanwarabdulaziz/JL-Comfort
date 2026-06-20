import { NextResponse } from 'next/server';

/**
 * Debug endpoint — lists all models available for the configured API key
 * and shows which ones support generateContent (image generation).
 * Visit: GET /api/debug-models
 */
export async function GET() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100`,
      {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    // Filter to models that support generateContent
    const models = (data.models || []).map((m: { name: string; displayName: string; supportedGenerationMethods: string[]; description?: string }) => ({
      name: m.name,
      displayName: m.displayName,
      supportedMethods: m.supportedGenerationMethods,
      supportsGenerateContent: m.supportedGenerationMethods?.includes('generateContent'),
      description: m.description,
    }));

    const imageModels = models.filter((m: { name: string }) =>
      m.name.toLowerCase().includes('imagen') ||
      m.name.toLowerCase().includes('image') ||
      m.name.toLowerCase().includes('flash') ||
      m.name.toLowerCase().includes('pro')
    );

    return NextResponse.json({
      total: models.length,
      imageRelatedModels: imageModels,
      allModels: models,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
