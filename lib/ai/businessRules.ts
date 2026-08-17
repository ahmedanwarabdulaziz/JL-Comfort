import { FabricAIFilters } from '@/lib/types/ai';

// Guided chip flow: plain business rules from real upholstery experience, per
// canada_fabric_business_strategy.md section 10. No AI call happens on this path — the
// chat-based free-text path (lib/ai/provider.ts) is the only place that spends an AI call.

export const PROJECT_TYPES = [
  'Sofa',
  'Dining Chair',
  'Custom Cushions',
  'Outdoor Seating',
  'Bench',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const HOUSEHOLD_OPTIONS = ['Kids', 'Pets', 'Both', 'Neither'] as const;
export type HouseholdOption = (typeof HOUSEHOLD_OPTIONS)[number];

export const PRIORITY_OPTIONS = ['Easy Cleaning', 'Durability', 'Price', 'Color First'] as const;
export type PriorityOption = (typeof PRIORITY_OPTIONS)[number];

const DURABLE_RUBS_THRESHOLD = 30000; // "Heavy Duty" territory in the catalog's own durability copy
const BUDGET_PRICE_CEILING = 40; // per yard; a reasonable "price-conscious" cutoff on this catalog

export function buildGuidedFilters(
  project: ProjectType,
  household: HouseholdOption,
  priority: PriorityOption
): FabricAIFilters {
  const filters: FabricAIFilters = {};

  // IF customer_has_pets/kids THEN prioritize durability + easy cleaning
  if (household === 'Pets' || household === 'Kids' || household === 'Both') {
    filters.minDurabilityRubs = DURABLE_RUBS_THRESHOLD;
    filters.easyClean = true;
  }

  // IF outdoor THEN require outdoor-rated fabric
  if (project === 'Outdoor Seating') {
    filters.outdoor = true;
  }

  // IF dining_chair THEN prioritize durability + tighter, easy-to-wipe materials
  if (project === 'Dining Chair') {
    filters.minDurabilityRubs = Math.max(filters.minDurabilityRubs ?? 0, DURABLE_RUBS_THRESHOLD);
    filters.materials = ['crypton', 'canvas-denim-twill', 'faux-wool'];
  }

  if (priority === 'Easy Cleaning') filters.easyClean = true;
  if (priority === 'Durability') filters.minDurabilityRubs = Math.max(filters.minDurabilityRubs ?? 0, DURABLE_RUBS_THRESHOLD);
  if (priority === 'Price') filters.maxPricePerYard = BUDGET_PRICE_CEILING;

  return filters;
}

export function guidedResultsMessage(project: ProjectType, count: number): string {
  const projectLower = project.toLowerCase();
  if (count === 0) {
    return `I couldn't find an exact match for a ${projectLower} with those needs — try telling me more in the chat and I'll take another look.`;
  }
  return `Here ${count === 1 ? 'is' : 'are'} ${count} fabric${count === 1 ? '' : 's'} that work well for a ${projectLower}.`;
}

// ─── Phase 2: Yousha questionnaire options ──────────────────────────────────

export type ShoppingCategory = 'fabric' | 'foam' | 'cushions' | 'other';

export interface CategoryOption {
  value: ShoppingCategory;
  label: string;
  emoji: string;
  /** If set, Yousha navigates to this path instead of asking more questions. */
  navigateTo?: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'fabric', label: 'Fabric', emoji: '🎨' },
  { value: 'foam', label: 'Foam', emoji: '🛋️', navigateTo: '/foam' },
  { value: 'cushions', label: 'Custom Cushions', emoji: '🪑', navigateTo: '/bench-cushions' },
  { value: 'other', label: 'Something else...', emoji: '✍️' },
];

// ── Fabric questions ────────────────────────────────────────────────────────

export interface QuestionOption {
  value: string;
  label: string;
  emoji?: string;
}

export interface FabricQuestion {
  id: 'application' | 'color' | 'pattern' | 'special';
  question: string;
  options: QuestionOption[];
  allowSkip?: boolean;
  skipLabel?: string;
}

export const FABRIC_QUESTIONS: FabricQuestion[] = [
  {
    id: 'application',
    question: "What's the fabric for?",
    options: [
      { value: 'sofa', label: 'Sofa / Chairs', emoji: '🛋️' },
      { value: 'dining', label: 'Dining Furniture', emoji: '🪑' },
      { value: 'curtains', label: 'Curtains & Drapes', emoji: '🪟' },
      { value: 'outdoor', label: 'Outdoor Seating', emoji: '☀️' },
      { value: 'bedding', label: 'Bedding', emoji: '🛏️' },
    ],
  },
  {
    id: 'color',
    question: 'Any color in mind?',
    options: [
      { value: 'beige-taupe', label: 'Neutral', emoji: '🤎' },
      { value: 'blue', label: 'Blue', emoji: '💙' },
      { value: 'grey-silver', label: 'Grey', emoji: '🩶' },
      { value: 'green', label: 'Green', emoji: '💚' },
      { value: 'brown', label: 'Brown', emoji: '🟤' },
      { value: 'white-ivory', label: 'White', emoji: '🤍' },
      { value: 'black', label: 'Black', emoji: '🖤' },
      { value: 'red-burgundy', label: 'Red', emoji: '❤️' },
    ],
  },
  {
    id: 'pattern',
    question: 'What pattern do you prefer?',
    options: [
      { value: 'plain-solid', label: 'Plain & Solid' },
      { value: 'stripe', label: 'Stripe' },
      { value: 'floral', label: 'Floral' },
      { value: 'abstract-geometric', label: 'Geometric' },
      { value: 'tweed-textures', label: 'Textured' },
    ],
    allowSkip: true,
    skipLabel: 'No preference',
  },
  {
    id: 'special',
    question: 'Any special needs?',
    options: [
      { value: 'pet', label: 'Pet-friendly & durable', emoji: '🐾' },
      { value: 'kid', label: 'Kid-safe & easy clean', emoji: '🧒' },
      { value: 'outdoor', label: 'Outdoor / marine-safe', emoji: '☀️' },
      { value: 'budget', label: 'Budget-friendly', emoji: '💰' },
    ],
    allowSkip: true,
    skipLabel: 'No special needs',
  },
];

// ── Questionnaire answer → FabricAIFilters mapping ──────────────────────────

export type QuestionnaireAnswers = Record<string, string>;

export function buildQuestionnaireFilters(answers: QuestionnaireAnswers): FabricAIFilters {
  const filters: FabricAIFilters = {};

  // Application answer
  const app = answers.application;
  if (app === 'sofa') {
    filters.applications = ['Upholstery'];
    filters.minDurabilityRubs = DURABLE_RUBS_THRESHOLD;
  } else if (app === 'dining') {
    filters.applications = ['Upholstery'];
    filters.minDurabilityRubs = DURABLE_RUBS_THRESHOLD;
    filters.easyClean = true;
  } else if (app === 'curtains') {
    filters.applications = ['Drapery'];
  } else if (app === 'outdoor') {
    filters.outdoor = true;
  } else if (app === 'bedding') {
    filters.applications = ['Bedding'];
  }

  // Color answer
  if (answers.color) {
    filters.colors = [answers.color];
  }

  // Pattern answer (empty string = skipped)
  if (answers.pattern) {
    filters.patterns = [answers.pattern];
  }

  // Special needs answer
  const special = answers.special;
  if (special === 'pet') {
    filters.minDurabilityRubs = Math.max(filters.minDurabilityRubs ?? 0, DURABLE_RUBS_THRESHOLD);
    filters.easyClean = true;
  } else if (special === 'kid') {
    filters.easyClean = true;
    filters.minDurabilityRubs = Math.max(filters.minDurabilityRubs ?? 0, 15000);
  } else if (special === 'outdoor') {
    filters.outdoor = true;
  } else if (special === 'budget') {
    filters.maxPricePerYard = BUDGET_PRICE_CEILING;
  }

  return filters;
}

/** Merges a custom-text AI-extracted filter set into base questionnaire filters. */
export function mergeFilters(base: FabricAIFilters, override: FabricAIFilters): FabricAIFilters {
  const merged = { ...base };

  if (override.colors?.length) merged.colors = [...(merged.colors ?? []), ...override.colors];
  if (override.patterns?.length) merged.patterns = [...(merged.patterns ?? []), ...override.patterns];
  if (override.materials?.length) merged.materials = [...(merged.materials ?? []), ...override.materials];
  if (override.applications?.length) merged.applications = [...(merged.applications ?? []), ...override.applications];
  if (override.outdoor) merged.outdoor = true;
  if (override.easyClean) merged.easyClean = true;
  if (override.minDurabilityRubs) merged.minDurabilityRubs = Math.max(merged.minDurabilityRubs ?? 0, override.minDurabilityRubs);
  if (override.maxPricePerYard != null) merged.maxPricePerYard = override.maxPricePerYard;
  if (override.keywords?.length) merged.keywords = [...(merged.keywords ?? []), ...override.keywords];

  return merged;
}
