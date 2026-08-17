import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIChatMessage } from '@/lib/types/ai';

// Groq first (fast/cheap, the plan's intended primary), Gemini as fallback — see
// fabric_ai_plan.md section 14. Keeping both behind this one function is the whole point:
// callers never know or care which provider actually answered.
//
// Both providers get the same system prompt as a static prefix on every call. That's
// intentional, not wasteful: Groq applies a 50% discount on cached input tokens, and Gemini
// 2.5 Flash has implicit caching on by default (~90% off repeated input above ~1k tokens) —
// this is the standard, provider-side fix for "the same instructions get sent every turn",
// not something to hand-roll here.

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 12000;

class ProviderError extends Error {}

async function askGroq(systemPrompt: string, messages: AIChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ProviderError('GROQ_API_KEY not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new ProviderError(`Groq request failed: ${res.status}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new ProviderError('Groq returned no content');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/** Gemini's generateContent takes one prompt, not a messages array, so prior turns are
 *  flattened into the prompt text — same transcript shape callers already send to Groq. */
function formatTranscript(messages: AIChatMessage[]): string {
  return messages
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`)
    .join('\n');
}

async function askGemini(systemPrompt: string, messages: AIChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ProviderError('GEMINI_API_KEY not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const result = await model.generateContent(`${systemPrompt}\n\n${formatTranscript(messages)}`);
  const text = result.response.text();
  if (!text) throw new ProviderError('Gemini returned no content');
  return text;
}

/**
 * Returns raw JSON text from whichever provider answers first. `messages` is the full
 * conversation so far (oldest first, latest user message last) — callers own trimming it to
 * a reasonable window. Throws only if both providers are unavailable/misconfigured/erroring —
 * callers must degrade gracefully (fabric_ai_plan.md section 14: "the website must continue
 * working without AI").
 */
export async function askAI(systemPrompt: string, messages: AIChatMessage[]): Promise<string> {
  try {
    return await askGroq(systemPrompt, messages);
  } catch (groqError) {
    try {
      return await askGemini(systemPrompt, messages);
    } catch (geminiError) {
      console.error('AI provider error (both Groq and Gemini failed):', { groqError, geminiError });
      throw new ProviderError('All AI providers unavailable');
    }
  }
}
