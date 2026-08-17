import { CharlotteFabricSnapshotItem } from '@/lib/types/charlotteFabric';
import { AIFabricResult, FabricAIFilters } from '@/lib/types/ai';

const MAX_RESULTS = 8;

/** Pulls the first Wyzenbeek double-rub count out of the catalog's free-text durability field. */
function parseDurabilityRubs(durability: string | undefined): number | null {
  if (!durability) return null;
  const match = durability.replace(/,/g, '').match(/(\d+)\s*(?:-|to)?\s*(?:wyzenbeek|rubs)/i);
  return match ? parseInt(match[1], 10) : null;
}

/** True if the cleanability text favors home-washable cleaning over dry-clean-only. */
function isEasyClean(cleanability: string | undefined): boolean {
  if (!cleanability) return false;
  const text = cleanability.toLowerCase();
  if (text.includes('dry clean only')) return false;
  return (
    text.includes('water based') ||
    text.includes('bleach cleanable') ||
    text.includes('machine wash')
  );
}

function isOutdoorSafe(markets: string[]): boolean {
  return markets.some((m) => /outdoor|marine/i.test(m));
}

const toResult = (item: CharlotteFabricSnapshotItem): AIFabricResult => ({
  id: item.id,
  name: item.name,
  sku: item.sku,
  imageUrl: item.imageUrl,
  productUrl: item.productUrl,
  color: item.color,
  pattern: item.pattern,
  material: item.material,
  pricePerYard: item.pricePerYard,
});

/**
 * Filters the pre-synced Charlotte Fabrics snapshot in-memory — no live DB query, no AI call.
 * The AI's only job upstream of this is producing a FabricAIFilters object; all matching logic
 * here is plain code per fabric_ai_plan.md's "don't use AI for something normal code can do" rule.
 */
export function filterCatalogSnapshot(
  items: CharlotteFabricSnapshotItem[],
  filters: FabricAIFilters
): AIFabricResult[] {
  const keywordsLower = filters.keywords?.map((k) => k.toLowerCase());

  const matched = items.filter((item) => {
    if (item.availability !== 'InStock') return false;

    if (filters.colors?.length && !item.color.some((c) => filters.colors!.includes(c))) return false;
    if (filters.patterns?.length && !item.pattern.some((p) => filters.patterns!.includes(p))) return false;
    if (filters.materials?.length && !item.material.some((m) => filters.materials!.includes(m))) return false;
    if (
      filters.applications?.length &&
      !item.applications.some((a) => filters.applications!.includes(a))
    ) {
      return false;
    }
    if (filters.outdoor && !isOutdoorSafe(item.markets)) return false;
    if (filters.easyClean && !isEasyClean(item.cleanability)) return false;

    if (filters.minDurabilityRubs) {
      const rubs = parseDurabilityRubs(item.durability);
      if (rubs === null || rubs < filters.minDurabilityRubs) return false;
    }

    if (filters.maxPricePerYard != null) {
      if (item.pricePerYard == null || item.pricePerYard > filters.maxPricePerYard) return false;
    }

    if (filters.minPricePerYard != null) {
      if (item.pricePerYard == null || item.pricePerYard < filters.minPricePerYard) return false;
    }

    if (keywordsLower?.length) {
      const haystack = `${item.name} ${item.sku}`.toLowerCase();
      if (!keywordsLower.some((k) => haystack.includes(k))) return false;
    }

    return true;
  });

  // Sort matched items
  matched.sort((a, b) => {
    // 1. Price sorting
    if (filters.minPricePerYard != null) {
      // Luxury mode: expensive first
      const diff = (b.pricePerYard ?? 0) - (a.pricePerYard ?? 0);
      if (diff !== 0) return diff;
    } else if (filters.maxPricePerYard != null) {
      // Budget mode: cheaper first
      const diff = (a.pricePerYard ?? Infinity) - (b.pricePerYard ?? Infinity);
      if (diff !== 0) return diff;
    }

    // 2. Relevancy: prioritize items where the requested color is the PRIMARY color
    if (filters.colors?.length) {
      const aPrimaryMatch = filters.colors.includes(a.color[0]) ? 1 : 0;
      const bPrimaryMatch = filters.colors.includes(b.color[0]) ? 1 : 0;
      if (bPrimaryMatch !== aPrimaryMatch) {
        return bPrimaryMatch - aPrimaryMatch;
      }
    }

    return 0;
  });

  return matched.slice(0, MAX_RESULTS).map(toResult);
}
