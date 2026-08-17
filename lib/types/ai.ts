// Shared contract for the AI shopping guide. Kept intentionally small for V1 — see
// fabric_ai_plan.md section 12 for the full future action vocabulary.

/** Safe actions the AI may request; the guide component (not the AI) decides how to render them. */
export type AIAction = 'show_message' | 'show_products';

export interface FabricAIFilters {
  /** Must be values from CHARLOTTE_FABRIC_COLORS (lib/data/charlotteFabricFacets.ts) — never free text. */
  colors?: string[];
  /** Must be values from CHARLOTTE_FABRIC_PATTERNS. */
  patterns?: string[];
  /** Must be values from CHARLOTTE_FABRIC_MATERIALS. */
  materials?: string[];
  /** One of the catalog's real `applications` values: Upholstery | Drapery | Bedding | Sheers. */
  applications?: string[];
  /** True if the customer needs outdoor/marine-safe fabric (matched against the `markets` field). */
  outdoor?: boolean;
  /** Minimum Wyzenbeek double-rub durability rating, parsed from the catalog's free-text `durability` field. */
  minDurabilityRubs?: number;
  /** True if cleanability should favor water-based/bleach-cleanable fabrics over dry-clean-only. */
  easyClean?: boolean;
  /** Ceiling on resolved price per yard. */
  maxPricePerYard?: number;
  /** Floor on resolved price per yard (used for luxury/high-end requests). */
  minPricePerYard?: number;
  /** Fallback substring match against name/sku when nothing else applies. */
  keywords?: string[];
}

/** A single result card the guide can render — deliberately smaller than the full CharlotteFabric type. */
export interface AIFabricResult {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  productUrl: string;
  color: string[];
  pattern: string[];
  material: string[];
  pricePerYard: number | null;
}

export interface AIGuideResponse {
  message: string;
  action: AIAction;
  filters?: FabricAIFilters;
  products?: AIFabricResult[];
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** A row from ai_chat_logs — admin-only visibility into what customers ask, never read back into the AI. */
export interface AIChatLogRow {
  id: string;
  sessionId: string;
  mode: 'guided' | 'chat';
  userMessage: string | null;
  assistantMessage: string;
  filters: FabricAIFilters;
  productCount: number;
  createdAt: Date;
}
