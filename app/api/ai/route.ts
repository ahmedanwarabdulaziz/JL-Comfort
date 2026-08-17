import { NextRequest, NextResponse } from 'next/server';
import { getCharlotteFabricsSnapshot } from '@/lib/data/charlotteFabricCatalog';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_MATERIALS,
  CHARLOTTE_FABRIC_PATTERNS,
} from '@/lib/data/charlotteFabricFacets';
import { filterCatalogSnapshot } from '@/lib/ai/fabricFilters';
import { askAI } from '@/lib/ai/provider';
import { FILTER_EXTRACTION_SYSTEM_PROMPT } from '@/lib/ai/systemPrompt';
import {
  HouseholdOption,
  PriorityOption,
  ProjectType,
  buildGuidedFilters,
  guidedResultsMessage,
  buildQuestionnaireFilters,
  QuestionnaireAnswers,
} from '@/lib/ai/businessRules';
import { AIChatMessage, AIGuideResponse, FabricAIFilters, AIFabricResult } from '@/lib/types/ai';
import { CharlotteFabricSnapshotItem } from '@/lib/types/charlotteFabric';
import { supabaseAdmin } from '@/lib/supabase/admin';

const VALID_COLORS = new Set(CHARLOTTE_FABRIC_COLORS.map((c) => c.value));
const VALID_PATTERNS = new Set(CHARLOTTE_FABRIC_PATTERNS.map((p) => p.value));
const VALID_MATERIALS = new Set(CHARLOTTE_FABRIC_MATERIALS.map((m) => m.value));
const VALID_APPLICATIONS = new Set(['Upholstery', 'Drapery', 'Bedding', 'Sheers']);

// Trims the conversation sent to the AI on every turn — a customer rambling for 30 messages
// shouldn't balloon every subsequent request's token cost. Recent context matters far more
// than full history for a filter-extraction task like this one.
const MAX_HISTORY_MESSAGES = 8;

const FALLBACK_MESSAGE =
  "Our AI assistant is having a coffee ☕ — you can still browse fabrics normally while it's away.";

/** Strips anything the model returned outside the real catalog's known values — belt-and-braces
 *  on top of the prompt's own constraints, since a model can still ignore instructions. */
function sanitizeFilters(raw: any): FabricAIFilters {
  const filters: FabricAIFilters = {};

  // Support both the old flat schema and the new nested 'filters' schema
  const source = raw.filters ? raw.filters : raw;

  if (Array.isArray(source.colors)) {
    const v = source.colors.filter((c: unknown) => typeof c === 'string' && VALID_COLORS.has(c));
    if (v.length) filters.colors = v;
  }
  if (Array.isArray(source.patterns)) {
    const v = source.patterns.filter((p: unknown) => typeof p === 'string' && VALID_PATTERNS.has(p));
    if (v.length) filters.patterns = v;
  }
  if (Array.isArray(source.materials)) {
    const v = source.materials.filter((m: unknown) => typeof m === 'string' && VALID_MATERIALS.has(m));
    if (v.length) filters.materials = v;
  }
  if (Array.isArray(source.applications)) {
    const v = source.applications.filter((a: unknown) => typeof a === 'string' && VALID_APPLICATIONS.has(a));
    if (v.length) filters.applications = v;
  }
  if (typeof source.outdoor === 'boolean') filters.outdoor = source.outdoor;
  if (typeof source.easyClean === 'boolean') filters.easyClean = source.easyClean;
  if (typeof source.minDurabilityRubs === 'number') filters.minDurabilityRubs = source.minDurabilityRubs;
  if (typeof source.maxPricePerYard === 'number') filters.maxPricePerYard = source.maxPricePerYard;
  if (typeof source.minPricePerYard === 'number') filters.minPricePerYard = source.minPricePerYard;
  if (Array.isArray(source.keywords)) {
    const v = source.keywords.filter((k: unknown) => typeof k === 'string').slice(0, 3);
    if (v.length) filters.keywords = v;
  }

  return filters;
}

/** Analytics-only audit log — never read back into the AI. Best-effort: a logging failure
 *  must never break the customer-facing response. */
async function logInteraction(
  sessionId: string | undefined,
  mode: 'guided' | 'chat',
  userMessage: string | null,
  response: AIGuideResponse
): Promise<void> {
  if (!supabaseAdmin || !sessionId) return;
  try {
    await supabaseAdmin.from('ai_chat_logs').insert({
      session_id: sessionId,
      mode,
      user_message: userMessage,
      assistant_message: response.message,
      filters: response.filters ?? {},
      product_count: response.products?.length ?? 0,
    });
  } catch (error) {
    console.error('Failed to log AI chat interaction:', error);
  }
}

interface FallbackOption {
  relaxed: string[];
  resultCount: number;
  products: AIFabricResult[];
}

function getFallbacks(filters: FabricAIFilters, snapshot: CharlotteFabricSnapshotItem[]): FallbackOption[] {
  const fallbacks: FallbackOption[] = [];
  
  if (filters.keywords?.length) {
    const f1 = { ...filters };
    delete f1.keywords;
    const res1 = filterCatalogSnapshot(snapshot, f1);
    if (res1.length > 0) fallbacks.push({ relaxed: ['specific name/keyword'], resultCount: res1.length, products: res1 });
  }

  const f2 = { ...filters };
  delete f2.keywords;
  delete f2.maxPricePerYard;
  delete f2.minPricePerYard;
  delete f2.minDurabilityRubs;
  delete f2.easyClean;
  const res2 = filterCatalogSnapshot(snapshot, f2);
  if (res2.length > 0) fallbacks.push({ relaxed: ['budget and performance limits'], resultCount: res2.length, products: res2 });

  if (filters.patterns?.length) {
    const f3 = { ...f2 };
    delete f3.patterns;
    const res3 = filterCatalogSnapshot(snapshot, f3);
    if (res3.length > 0) fallbacks.push({ relaxed: ['pattern'], resultCount: res3.length, products: res3 });
  }

  if (filters.materials?.length) {
    const f4 = { ...f2 };
    delete f4.materials;
    const res4 = filterCatalogSnapshot(snapshot, f4);
    if (res4.length > 0) fallbacks.push({ relaxed: ['material'], resultCount: res4.length, products: res4 });
  }

  if (filters.colors?.length) {
    const f5 = { ...f2 };
    delete f5.colors;
    const res5 = filterCatalogSnapshot(snapshot, f5);
    if (res5.length > 0) fallbacks.push({ relaxed: ['color'], resultCount: res5.length, products: res5 });
  }

  return fallbacks;
}

async function handleChat(history: AIChatMessage[]): Promise<AIGuideResponse> {
  const trimmed = history.slice(-MAX_HISTORY_MESSAGES);

  let systemPromptToUse = FILTER_EXTRACTION_SYSTEM_PROMPT;
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_settings')
        .select('persona, output_schema, rules, system_prompt')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      // PGRST116 means zero rows found, which is fine before initial seed
      if (!error && data) {
        if (data.persona !== null && data.persona !== undefined) {
          systemPromptToUse = `${data.persona || ''}\n\n${data.output_schema || ''}\n\nRules:\n${data.rules || ''}`;
        } else if (data.system_prompt) {
          systemPromptToUse = data.system_prompt;
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch AI settings, falling back to static prompt:', error);
      }
    } catch (err) {
      console.error('Unexpected error fetching AI settings:', err);
    }
  }

  let raw: any;
  try {
    const text = await askAI(systemPromptToUse, trimmed);
    raw = JSON.parse(text);
  } catch (error) {
    console.error('AI guide chat error:', error);
    return { message: FALLBACK_MESSAGE, action: 'show_message' };
  }

  const filters = sanitizeFilters(raw);
  const hasFilters = Object.keys(filters).length > 0;
  const aiMessage = typeof raw.message === 'string' ? raw.message : "Here's what I found.";

  if (!hasFilters) {
    return { message: aiMessage, action: 'show_message' };
  }

  const snapshot = await getCharlotteFabricsSnapshot();
  let products = filterCatalogSnapshot(snapshot, filters);

  // Smart Relaxed Search: If strict filters yield 0 results, progressively relax them
  let finalMessage = aiMessage;

  if (products.length === 0 && hasFilters) {
    const fallbacks = getFallbacks(filters, snapshot);
    
    if (fallbacks.length > 0) {
      // Pick the best fallback (highest priority relaxation that yields results)
      const best = fallbacks[0];
      products = best.products;
      
      const fallbackPrompt = `
      The exact match yielded 0 results. 
      However, if we relax the following constraints: ${best.relaxed.join(', ')}, we found ${best.resultCount} great alternatives.
      
      Write a warm, sales-focused response explaining that we are very close, and that loosening those specific constraints gives us ${best.resultCount} beautiful options (which you are showing them).
      Do NOT apologize or say "we don't carry that." Use phrases like "We're one step away..." or "Your combination works well, but...".
      End the message with a short, easy call to action (e.g. "Want to see those options?").
      Keep it under 40 words. Return ONLY JSON in the following format:
      { "message": "your text here" }
      `;
      
      try {
        const fbRaw = await askAI(fallbackPrompt, []);
        const fbJson = JSON.parse(fbRaw);
        if (fbJson.message) finalMessage = fbJson.message;
      } catch (err) {
        finalMessage = `I couldn't find an exact match, but I relaxed your ${best.relaxed.join(' and ')} to find these ${best.resultCount} fantastic alternatives!`;
      }
    } else {
      const activeFilters = [];
      if (filters.colors?.length) activeFilters.push('color');
      if (filters.patterns?.length) activeFilters.push('pattern');
      if (filters.materials?.length) activeFilters.push('material');
      
      if (activeFilters.length > 0) {
        finalMessage = `I'm having trouble finding a fabric that matches all of those exact requirements. Which detail are you most willing to compromise on so I can find you some great options—the ${activeFilters.join(' or ')}?`;
      } else {
        finalMessage = "I couldn't find any fabrics matching those exact requirements right now. Want to try a slightly broader search?";
      }
    }
  }

  return { message: finalMessage, action: 'show_products', filters, products };
}

async function handleGuided(
  project: ProjectType,
  household: HouseholdOption,
  priority: PriorityOption
): Promise<AIGuideResponse> {
  const filters = buildGuidedFilters(project, household, priority);
  const snapshot = await getCharlotteFabricsSnapshot();
  const products = filterCatalogSnapshot(snapshot, filters);

  return {
    message: guidedResultsMessage(project, products.length),
    action: 'show_products',
    filters,
    products,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;

    if (body.mode === 'guided') {
      const { project, household, priority } = body;
      if (!project || !household || !priority) {
        return NextResponse.json({ error: 'Missing guided flow selection' }, { status: 400 });
      }
      const response = await handleGuided(project, household, priority);
      await logInteraction(sessionId, 'guided', null, response);
      return NextResponse.json(response);
    }

    if (body.mode === 'chat') {
      const history: AIChatMessage[] = Array.isArray(body.history) ? body.history : [];
      const lastUserMessage = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';
      if (!lastUserMessage.trim()) {
        return NextResponse.json({ error: 'Missing message' }, { status: 400 });
      }
      const response = await handleChat(history);
      await logInteraction(sessionId, 'chat', lastUserMessage, response);
      return NextResponse.json(response);
    }

    if (body.mode === 'questionnaire') {
      const answers: QuestionnaireAnswers = body.answers ?? {};
      if (!Object.keys(answers).length) {
        return NextResponse.json({ error: 'Missing questionnaire answers' }, { status: 400 });
      }
      const filters = buildQuestionnaireFilters(answers);
      const snapshot = await getCharlotteFabricsSnapshot();
      let products = filterCatalogSnapshot(snapshot, filters);
      
      const hasFilters = Object.keys(filters).length > 0;

      // Smart Relaxed Search
      let message = '';
      if (products.length === 0 && hasFilters) {
        const fallbacks = getFallbacks(filters, snapshot);
        
        if (fallbacks.length > 0) {
          const best = fallbacks[0];
          products = best.products;
          
          const fallbackPrompt = `
          The exact match yielded 0 results. 
          However, if we relax the following constraints: ${best.relaxed.join(', ')}, we found ${best.resultCount} great alternatives.
          
          Write a warm, sales-focused response explaining that we are very close, and that loosening those specific constraints gives us ${best.resultCount} beautiful options (which you are showing them).
          Do NOT apologize or say "we don't carry that." Use phrases like "We're one step away..." or "Your combination works well, but...".
          End the message with a short, easy call to action (e.g. "Want to see those options?").
          Keep it under 40 words. Return ONLY JSON in the following format:
          { "message": "your text here" }
          `;
          
          try {
            const fbRaw = await askAI(fallbackPrompt, []);
            const fbJson = JSON.parse(fbRaw);
            if (fbJson.message) message = fbJson.message;
          } catch (err) {
            message = `I couldn't find an exact match, but I relaxed your ${best.relaxed.join(' and ')} to find these ${best.resultCount} great alternatives!`;
          }
        } else {
          const activeFilters = [];
          if (filters.colors?.length) activeFilters.push('color');
          if (filters.patterns?.length) activeFilters.push('pattern');
          if (filters.materials?.length) activeFilters.push('material');
          
          if (activeFilters.length > 0) {
            message = `I'm having trouble finding a fabric that matches all of those exact requirements. Which detail are you most willing to compromise on so I can find you some great options—the ${activeFilters.join(' or ')}?`;
          } else {
            message = "I couldn't find any fabrics matching those exact requirements right now. Want to try a slightly broader search?";
          }
        }
      } else {
        const count = products.length;
        message = `I found ${count} fabric${count === 1 ? '' : 's'} that match your needs! Click any to see details 🎉`;
      }
      const response: AIGuideResponse = { message, action: 'show_products', filters, products };
      await logInteraction(sessionId, 'guided', JSON.stringify(answers), response);
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    console.error('AI guide route error:', error);
    return NextResponse.json(
      { message: FALLBACK_MESSAGE, action: 'show_message' } satisfies AIGuideResponse,
      { status: 200 }
    );
  }
}
