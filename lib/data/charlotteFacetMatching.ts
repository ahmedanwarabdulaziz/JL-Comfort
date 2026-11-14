import type { CharlotteFabric } from '@/lib/types/charlotteFabric';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_MATERIALS,
  CHARLOTTE_FABRIC_PATTERNS,
  FabricFacetOption,
} from './charlotteFabricFacets';

/**
 * The ten filter groups on charlottefabrics.com/product-category/fabric/, with the same option
 * values, labels and order. Colour, pattern and material are tagged by the sync's facet crawl; the
 * other seven are worked out here from each fabric's spec sheet (features, content, durability,
 * origin, flammability...), since the sync doesn't crawl those facets.
 *
 * Matching works like Charlotte's FacetWP setup: every ticked value must match, within a group as
 * well as across groups (Blue + Green = fabrics tagged both blue and green).
 */
export type FacetKey =
  | 'color'
  | 'pattern'
  | 'material'
  | 'application'
  | 'market'
  | 'features'
  | 'performance'
  | 'fiberContent'
  | 'rubCount'
  | 'patternDirection';

export const FACET_KEYS: FacetKey[] = [
  'color',
  'pattern',
  'material',
  'application',
  'market',
  'features',
  'performance',
  'fiberContent',
  'rubCount',
  'patternDirection',
];

export const FACET_TITLES: Record<FacetKey, string> = {
  color: 'Color',
  pattern: 'Pattern',
  material: 'Material',
  application: 'Application',
  market: 'Market',
  features: 'Features',
  performance: 'Performance',
  fiberContent: 'Fiber Content',
  rubCount: 'Rub Count',
  patternDirection: 'Pattern Direction',
};

export const FACET_OPTIONS: Record<FacetKey, FabricFacetOption[]> = {
  color: CHARLOTTE_FABRIC_COLORS,
  pattern: CHARLOTTE_FABRIC_PATTERNS,
  material: CHARLOTTE_FABRIC_MATERIALS,
  application: [
    { value: 'upholstery', label: 'Upholstery' },
    { value: 'drapery', label: 'Drapery' },
    { value: 'bedding', label: 'Bedding' },
    { value: 'sheers', label: 'Sheers' },
  ],
  market: [
    { value: 'home', label: 'Home' },
    { value: 'contract', label: 'Contract' },
    { value: 'marine', label: 'Marine' },
    { value: 'outdoors', label: 'Outdoors' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'automotive', label: 'Automotive' },
  ],
  features: [
    { value: 'bacteria-mildew-resistant', label: 'Bacteria & Mildew Resistant' },
    { value: 'crypton', label: 'Crypton' },
    { value: 'green-eco-friendly', label: 'Eco Friendly' },
    { value: 'fade-resistant', label: 'Fade Resistant' },
    { value: 'greenguard-gold', label: 'Greenguard Gold' },
    { value: 'lifeguard', label: 'Lifeguard' },
    { value: 'machine-washable', label: 'Machine Washable' },
    { value: 'made-in-america', label: 'Made In America' },
    { value: 'oeko-tex-100', label: 'Oeko-Tex 100' },
    { value: 'passes-can-ulc-s109', label: 'Passes CAN/ULC-S109' },
    { value: 'passes-nfpa-701', label: 'Passes NFPA 701' },
    { value: 'performance-grade', label: 'Performance Grade' },
    { value: 'pet-friendly', label: 'Pet Friendly' },
    { value: 'stain-resistant', label: 'Stain Resistant' },
    { value: 'waterproof', label: 'Waterproof' },
    { value: 'weather-resistant', label: 'Weather Resistant' },
  ],
  performance: [
    { value: 'all-performance', label: 'All Performance' },
    { value: 'crypton', label: 'Crypton' },
    { value: 'ecofiber', label: 'EcoFiber' },
    { value: 'lifeguard', label: 'Lifeguard' },
    { value: 'outdoor-indoor', label: 'Outdoor/Indoor' },
    { value: 'revolution', label: 'Revolution' },
    { value: 'stain-resistant', label: 'Stain Resistant' },
  ],
  fiberContent: [
    { value: 'acrylic', label: 'Acrylic' },
    { value: 'cotton', label: 'Cotton' },
    { value: 'linen', label: 'Linen' },
    { value: 'olefin', label: 'Olefin (Polypropylene)' },
    { value: 'polyester', label: 'Polyester' },
    { value: 'blend', label: 'Multiple Contents (Blend)' },
    { value: 'no-blend', label: 'Single Content (100%)' },
  ],
  rubCount: [
    { value: 'exceeds-15000', label: 'Exceeds 15,000' },
    { value: 'exceeds-30000', label: 'Exceeds 30,000' },
    { value: 'exceeds-50000', label: 'Exceeds 50,000' },
    { value: 'exceeds-100000', label: 'Exceeds 100,000' },
  ],
  patternDirection: [
    { value: 'up-the-roll', label: 'Up The Roll' },
    { value: 'railroaded', label: 'Railroaded' },
  ],
};

export const facetOptionLabel = (key: FacetKey, value: string) =>
  FACET_OPTIONS[key].find((o) => o.value === value)?.label || value;

export type FabricFacetValues = Record<FacetKey, string[]>;

const slug = (s: string) => s.trim().toLowerCase();

const MARKET_ALIASES: Record<string, string> = { outdoor: 'outdoors', auto: 'automotive' };

const FIBERS: [string, RegExp][] = [
  ['acrylic', /acrylic/],
  ['cotton', /cotton/],
  ['linen', /linen|flax/],
  ['olefin', /olefin|polypropylene/],
  ['polyester', /polyester/],
];

function fiberValues(content: string | undefined): string[] {
  const text = (content || '').toLowerCase();
  if (!text) return [];
  const fibers = FIBERS.filter(([, re]) => re.test(text)).map(([value]) => value);
  // "100% ..." (optionally after a weight like "20oz,") is one fibre; with no percentages, one named fibre is too.
  const hasPercent = /\d\s*%/.test(text);
  const isSingle = /^\s*(\d+\s*oz\.?,?\s*)?100\s*%/.test(text) || (!hasPercent && fibers.length === 1 && !/&|\band\b/.test(text));
  return [...fibers, isSingle ? 'no-blend' : 'blend'];
}

function rubValues(durability: string | undefined): string[] {
  const match = (durability || '').replace(/,/g, '').match(/(\d{4,7})/);
  if (!match) return [];
  const rubs = Number(match[1]);
  return [15000, 30000, 50000, 100000].filter((n) => rubs >= n).map((n) => `exceeds-${n}`);
}

function directionValues(direction: string | undefined): string[] {
  const text = (direction || '').toLowerCase();
  if (!text) return [];
  if (/not railroaded|up the roll/.test(text)) return ['up-the-roll'];
  if (/railroaded|across the roll/.test(text)) return ['railroaded'];
  return [];
}

// The master spreadsheet's "Properties" column is the list Charlotte's Features filter is built from.
const PROPERTY_TO_FEATURE: Record<string, string> = {
  'bacteria & mildew resistant': 'bacteria-mildew-resistant',
  crypton: 'crypton',
  'eco friendly': 'green-eco-friendly',
  'fade resistant': 'fade-resistant',
  'greenguard gold': 'greenguard-gold',
  lifeguard: 'lifeguard',
  'machine washable': 'machine-washable',
  'made in america': 'made-in-america',
  'passes can/ulc-s109': 'passes-can-ulc-s109',
  'passes nfpa 701': 'passes-nfpa-701',
  'oeko-tex 100': 'oeko-tex-100',
  'performance grade': 'performance-grade',
  'pet friendly': 'pet-friendly',
  'stain resistant': 'stain-resistant',
  waterproof: 'waterproof',
  'weather resistant': 'weather-resistant',
};

function featureValues(f: CharlotteFabric): string[] {
  const out = new Set<string>();
  for (const p of f.properties || []) {
    const value = PROPERTY_TO_FEATURE[slug(p)];
    if (value) out.add(value);
  }
  // Fabrics without spreadsheet tags fall back to what their spec sheet says.
  if (!f.properties?.length) for (const v of specFeatureValues(f)) out.add(v);
  return Array.from(out);
}

function specFeatureValues(f: CharlotteFabric): string[] {
  const features = (f.features || '').toLowerCase();
  const cleaning = (f.cleanability || '').toLowerCase();
  const flame = (f.flammability || '').toLowerCase();
  const origin = (f.origin || '').toLowerCase();
  const content = (f.fiberContent || '').toLowerCase();
  const out: string[] = [];
  if (/mildew|bacteria/.test(features)) out.push('bacteria-mildew-resistant');
  if (/crypton/.test(features)) out.push('crypton');
  if (/fade/.test(features)) out.push('fade-resistant');
  if (/lifeguard/.test(features)) out.push('lifeguard');
  if (/machine wash/.test(features) || /machine wash/.test(cleaning)) out.push('machine-washable');
  if (/usa|america/.test(origin) && !/finished/.test(origin)) out.push('made-in-america');
  if (/can\/ulc/.test(flame)) out.push('passes-can-ulc-s109');
  if (/nfpa (fr )?701/.test(flame)) out.push('passes-nfpa-701');
  if (/stain/.test(features)) out.push('stain-resistant');
  if (/waterproof/.test(features) || /waterproof/.test(content)) out.push('waterproof');
  if (/weather resistant/.test(features)) out.push('weather-resistant');
  return out;
}

function performanceValues(f: CharlotteFabric, markets: string[]): string[] {
  const features = (f.features || '').toLowerCase();
  const out: string[] = [];
  if (/crypton/.test(features)) out.push('crypton');
  if (/ecofiber/.test(features)) out.push('ecofiber');
  if (/lifeguard/.test(features)) out.push('lifeguard');
  if (markets.includes('outdoors') || /weather resistant/.test(features)) out.push('outdoor-indoor');
  if (/revolution/.test(features)) out.push('revolution');
  if (/stain/.test(features) && !out.some((v) => v === 'crypton' || v === 'ecofiber' || v === 'lifeguard' || v === 'revolution')) {
    out.push('stain-resistant');
  }
  if (out.length) out.unshift('all-performance');
  return out;
}

const cache = new WeakMap<CharlotteFabric, FabricFacetValues>();

/** Every Charlotte filter value a fabric falls under, worked out once per fabric object. */
export function fabricFacetValues(f: CharlotteFabric): FabricFacetValues {
  const hit = cache.get(f);
  if (hit) return hit;
  const markets = Array.from(new Set((f.markets || []).map((m) => MARKET_ALIASES[slug(m)] || slug(m))));
  const values: FabricFacetValues = {
    color: f.color || [],
    pattern: f.pattern || [],
    material: f.material || [],
    application: (f.applications || []).map(slug),
    market: markets,
    features: featureValues(f),
    performance: performanceValues(f, markets),
    fiberContent: fiberValues(f.fiberContent),
    rubCount: rubValues(f.durability),
    patternDirection: directionValues(f.patternDirection),
  };
  cache.set(f, values);
  return values;
}

/** True when the fabric carries every ticked value in every group. */
export function matchesFacets(f: CharlotteFabric, selected: Partial<Record<FacetKey, string[]>>): boolean {
  const values = fabricFacetValues(f);
  for (const key of FACET_KEYS) {
    const wanted = selected[key];
    if (wanted?.length && !wanted.every((v) => values[key].includes(v))) return false;
  }
  return true;
}
