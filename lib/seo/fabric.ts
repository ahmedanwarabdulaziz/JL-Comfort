// Shared wording for a fabric in search results, link previews, structured data and the product feed.

export interface FabricSeoFields {
  name: string;
  fiberContent?: string | null;
  durability?: string | null;
  width?: string | null;
  pricePerYard: number | null;
  keywords?: string; // "Grey Textured", from lib/collections/definitions.ts fabricKeywords()
}

const MAX_DESCRIPTION = 158; // search results cut descriptions off at about this length

// A one-sentence summary built from the fabric's own specs, kept short enough to show in full in
// search results: the least important specs are dropped first when it runs long.
export function describeFabric(fabric: FabricSeoFields): string {
  const kind = fabric.keywords ? `${fabric.keywords.toLowerCase()} upholstery fabric` : 'upholstery fabric';
  const price = fabric.pricePerYard != null ? ` $${fabric.pricePerYard.toFixed(2)}/yd CAD.` : '';
  const durability = fabric.durability?.replace(/^Exceeds\s+/i, '').replace(/\s*Wyzenbeek\s+Rubs?/i, ' double rubs');
  const specs = [fabric.fiberContent, durability, fabric.width ? `${fabric.width} wide` : null].filter(Boolean) as string[];
  const build = (parts: string[], tail: string) =>
    `${fabric.name} ${kind} by the yard${parts.length ? ` — ${parts.join(', ')}` : ''}.${price}${tail}`;
  for (let count = specs.length; count >= 0; count--) {
    for (const tail of [' Free samples, shipped across Canada.', ' Free samples.', '']) {
      const text = build(specs.slice(0, count), tail);
      if (text.length <= MAX_DESCRIPTION) return text;
    }
  }
  return build([], '').slice(0, MAX_DESCRIPTION);
}

// Catalog facet slugs ("grey-silver") as shoppers read them ("Grey/Silver").
export const prettyFacet = (slug: string) =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('/');
