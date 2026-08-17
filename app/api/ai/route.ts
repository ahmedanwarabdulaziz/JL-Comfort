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
import { AIChatMessage, AIGuideResponse, FabricAIFilters } from '@/lib/types/ai';
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
  let isAlternative = false;
  let droppedReason = '';
  if (products.length === 0 && hasFilters) {
    // Attempt 2: Drop keywords (often too restrictive due to exact match)
    if (filters.keywords && filters.keywords.length > 0) {
      const relaxed = { ...filters };
      delete relaxed.keywords;
      products = filterCatalogSnapshot(snapshot, relaxed);
      if (products.length > 0) {
        droppedReason = 'specific name';
      }
    }

    // Attempt 3: Drop special needs (durability, easy clean, budget) to just match color/pattern
    if (products.length === 0) {
      const relaxedMore = { ...filters };
      delete relaxedMore.keywords;
      delete relaxedMore.easyClean;
      delete relaxedMore.minDurabilityRubs;
      delete relaxedMore.maxPricePerYard;
      products = filterCatalogSnapshot(snapshot, relaxedMore);
      if (products.length > 0) {
        droppedReason = 'budget and durability requirements';
      }
    }
    
    if (products.length > 0) {
      isAlternative = true;
    }
  }

  let finalMessage = aiMessage;
  if (isAlternative) {
    finalMessage = `I couldn't find an exact match for all your requirements, so I relaxed your ${droppedReason} to find these ${products.length} fantastic alternative${products.length === 1 ? '' : 's'}!`;
  } else if (products.length === 0) {
    const activeFilters = [];
    if (filters.colors?.length) activeFilters.push('color');
    if (filters.patterns?.length) activeFilters.push('pattern');
    if (filters.materials?.length) activeFilters.push('material');
    
    if (activeFilters.length > 0) {
      const list = activeFilters.join(' or ');
      finalMessage = `I'm having trouble finding a fabric that matches all of those exact requirements. Which detail are you most willing to compromise on so I can find you some great options—the ${list}?`;
    } else {
      finalMessage = "I couldn't find any fabrics matching those exact requirements right now. Want to try a slightly broader search?";
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
      
      let isAlternative = false;
      let droppedReason = '';
      const hasFilters = Object.keys(filters).length > 0;
      
      // Smart Relaxed Search: If strict filters yield 0 results, progressively relax them
      if (products.length === 0 && hasFilters) {
        // Attempt 2: Drop keywords
        if (filters.keywords && filters.keywords.length > 0) {
          const relaxed = { ...filters };
          delete relaxed.keywords;
          products = filterCatalogSnapshot(snapshot, relaxed);
          if (products.length > 0) {
            droppedReason = 'specific name';
          }
        }

        // Attempt 3: Drop special needs
        if (products.length === 0) {
          const relaxedMore = { ...filters };
          delete relaxedMore.keywords;
          delete relaxedMore.easyClean;
          delete relaxedMore.minDurabilityRubs;
          delete relaxedMore.maxPricePerYard;
          products = filterCatalogSnapshot(snapshot, relaxedMore);
          if (products.length > 0) {
            droppedReason = 'budget and durability requirements';
          }
        }

        if (products.length > 0) {
          isAlternative = true;
        }
      }

      const count = products.length;
      let message = '';
      if (count === 0) {
        const activeFilters = [];
        if (filters.colors?.length) activeFilters.push('color');
        if (filters.patterns?.length) activeFilters.push('pattern');
        if (filters.materials?.length) activeFilters.push('material');
        
        if (activeFilters.length > 0) {
          const list = activeFilters.join(' or ');
          message = `I'm having trouble finding a fabric that matches all of those exact requirements. Which detail are you most willing to compromise on so I can find you some great options—the ${list}?`;
        } else {
          message = "I couldn't find any fabrics matching those exact requirements right now. Want to try a slightly broader search?";
        }
      } else if (isAlternative) {
        message = `I couldn't find an exact match, so I relaxed your ${droppedReason} to find these ${count} great alternative${count === 1 ? '' : 's'}! Let me know if you want to tweak anything else.`;
      } else {
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
