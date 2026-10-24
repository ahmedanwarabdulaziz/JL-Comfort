// Shopper-facing copy for a fabric page, written from the fabric's own specs: an "About this fabric"
// summary and a yardage guide. Charlotte's site and every other dealer show the same spec sheet; this
// text is what makes each of our fabric pages its own page, and it answers what buyers actually ask
// (is it tough enough, how do I clean it, how much do I need).

export interface FabricCopyInput {
  brand: string; // "Charlotte Fabrics"
  pattern: string; // "D2215"
  colourway: string; // "Sky"
  keywords: string; // "Grey Textured", from fabricKeywords()
  collection?: string; // "Textured Plains II"
  fiberContent?: string;
  width?: string;
  repeat?: string;
  patternDirection?: string;
  durability?: string;
  cleanability?: string;
  properties?: string[];
  applications?: string[];
  markets?: string[];
  origin?: string;
}

const list = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const inches = (value?: string) => {
  const match = value?.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
};

// "Horizontal 13.5" x Vertical 13.5"" -> 13.5; "No Repeat" or a horizontal-only repeat -> 0.
const verticalRepeat = (repeat?: string) => {
  const match = repeat?.match(/vertical:?\s*(\d*\.?\d+)/i);
  return match ? Number(match[1]) : 0;
};

const doubleRubs = (durability?: string) => {
  const match = durability?.replace(/,/g, '').match(/(\d{4,7})/);
  return match && /wyzenbeek/i.test(durability || '') ? Number(match[1]) : null;
};

const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

const isWide = (width?: string) => (inches(width) ?? 54) >= 100;
const railroaded = (direction?: string) => (direction ? !/not railroaded|up the roll/i.test(direction) : null);

const PROPERTY_WORDS: Record<string, string> = {
  'Stain Resistant': 'stain resistant',
  'Fade Resistant': 'fade resistant',
  'Pet Friendly': 'pet friendly',
  'Bacteria & Mildew Resistant': 'bacteria and mildew resistant',
  'Water Resistant': 'water resistant',
  Waterproof: 'waterproof',
  'Weather Resistant': 'weather resistant',
  'Machine Washable': 'machine washable',
};

function durabilitySentence(f: FabricCopyInput): string | null {
  const rubs = doubleRubs(f.durability);
  if (rubs == null) return null;
  const rated = `It is rated at more than ${rubs.toLocaleString('en-CA')} double rubs (Wyzenbeek)`;
  if (rubs >= 100000) return `${rated}, which is heavy duty: tough enough for family sofas, busy dining chairs and commercial seating.`;
  if (rubs >= 50000) return `${rated}, enough for everyday furniture in busy homes and most commercial seating.`;
  if (rubs >= 30000) return `${rated}, suitable for everyday furniture such as sofas, chairs and ottomans.`;
  if (rubs >= 15000) return `${rated}, best for light to moderate use: accent chairs, headboards and pillows.`;
  return `${rated}, so it is best kept for decorative pieces such as pillows, headboards and drapery.`;
}

function careSentence(cleanability?: string): string | null {
  if (!cleanability) return null;
  const c = cleanability.toLowerCase();
  const ratio = cleanability.match(/\((1:10|10%)\)/)?.[1];
  let text: string;
  if (c.includes('bleach')) {
    text = `It cleans with mild soap and water and is bleach cleanable${ratio ? ` (diluted ${ratio})` : ''}, so it can be disinfected.`;
  } else if (c.includes('machine wash')) {
    text = `Clean it with water-based cleaners; it can also be machine washed cold and air dried.`;
  } else if (/water/.test(c) && /solvent/.test(c)) {
    text = 'Cleaning code W/S: use either water-based or solvent-based (dry-cleaning) upholstery cleaners.';
  } else if (c.includes('water')) {
    text = 'Cleaning code W: spot clean with water-based upholstery cleaners.';
  } else if (c.includes('solvent')) {
    text = 'Cleaning code S: use solvent-based (water-free) cleaners only, as water can leave marks.';
  } else if (/professional|dry clean/.test(c)) {
    text = 'Have it professionally cleaned rather than cleaning it at home.';
  } else {
    text = `Care: ${cleanability}.`;
  }
  return `${text} Always test a cleaner on a hidden area first.`;
}

// A few sentences about the fabric, built only from its spec sheet (no claims the data doesn't support).
export function aboutFabric(f: FabricCopyInput): string[] {
  const name = [f.pattern, f.colourway].filter(Boolean).join(' ');
  const kind = `${f.keywords ? `${f.keywords.toLowerCase()} ` : ''}${isWide(f.width) ? 'fabric' : 'upholstery fabric'}`;
  const makeup = [f.fiberContent, f.width ? `${inches(f.width) ?? f.width}" wide` : null].filter(Boolean) as string[];
  const intro =
    `${name} is ${article(kind)} ${kind} by ${f.brand}${f.collection ? `, from the ${f.collection} collection` : ''}.` +
    (makeup.length ? ` It is ${list(makeup)}${f.origin ? `, made in ${f.origin}` : ''}.` : '');

  const use: string[] = [];
  const durability = durabilitySentence(f);
  if (durability) use.push(durability);
  const markets = f.markets || [];
  const settings = [
    markets.includes('Contract') ? 'commercial (contract) projects' : null,
    markets.some((m) => /outdoor/i.test(m)) ? 'outdoor furniture' : null,
    markets.includes('Marine') ? 'boats' : null,
    markets.includes('Healthcare') ? 'healthcare seating' : null,
  ].filter(Boolean) as string[];
  if (settings.length) use.push(`As well as homes, it is suited to ${list(settings)}.`);
  const forUpholstery = (f.applications || []).includes('Upholstery');
  const applications = (f.applications || []).filter((a) => a !== 'Upholstery').map((a) => a.toLowerCase());
  if (applications.length) use.push(forUpholstery ? `Besides upholstery, it works for ${list(applications)}.` : `It is made for ${list(applications)}.`);

  const traits = (f.properties || []).map((p) => PROPERTY_WORDS[p]).filter(Boolean);
  const extras: string[] = [];
  if (traits.length) {
    const petNote = (f.properties || []).includes('Pet Friendly') ? ', a good choice for homes with pets and kids' : '';
    extras.push(`It is ${list(traits)}${petNote}.`);
  }
  if (f.properties?.includes('Crypton')) extras.push('It is a Crypton performance fabric, with stain, odour and moisture protection built into the fibre.');
  if (f.properties?.includes('Greenguard Gold')) extras.push('It is Greenguard Gold certified for low chemical emissions.');
  const flame = (f.properties || []).filter((p) => p.startsWith('Passes ')).map((p) => p.replace('Passes ', ''));
  if (flame.length) extras.push(`It passes the ${list(flame)} flame test${flame.length > 1 ? 's' : ''}, often required for commercial drapery.`);

  const care = careSentence(f.cleanability);
  const rr = railroaded(f.patternDirection);
  const cutting =
    rr == null || isWide(f.width)
      ? null
      : rr
      ? 'It is railroaded (the pattern runs across the roll), so long pieces such as sofa backs and seats can usually be cut without seams.'
      : 'The pattern runs up the roll, the usual direction for upholstery, so very wide pieces such as sofa backs may need a seam.';

  return [intro, use.join(' '), [extras.join(' '), care, cutting].filter(Boolean).join(' ')].filter(Boolean);
}

// Typical yardage for a 54"-wide plain fabric; adjusted below for this fabric's width and repeat.
const BASE_YARDAGE: [string, number, number][] = [
  ['Dining chair seat', 0.75, 1],
  ['Dining chair, seat and back', 1.5, 2],
  ['Ottoman or footstool', 2, 3],
  ['Headboard (queen)', 2, 3],
  ['Accent or slipper chair', 4, 6],
  ['Armchair or club chair', 6, 8],
  ['Wingback chair', 7, 9],
  ['Loveseat', 10, 12],
  ['Sofa (three seats)', 14, 18],
  ['Sectional', 20, 30],
];

export interface YardageGuide {
  rows: { item: string; yards: string }[];
  notes: string[];
}

// How much to order for common pieces, in whole yards (fabric is sold by the whole yard).
// Wide drapery and sheer fabrics get no furniture table: they're ordered by window, not by chair.
export function yardageGuide(f: FabricCopyInput): YardageGuide | null {
  const width = inches(f.width) ?? 54;
  if (width >= 100) return null;
  const repeat = verticalRepeat(f.repeat);
  const repeatFactor = repeat >= 13 ? 1.2 : repeat >= 6 ? 1.1 : 1;
  const factor = (54 / width) * repeatFactor;
  const yards = (n: number) => Math.max(1, Math.ceil(n * factor - 0.01));
  const rows = BASE_YARDAGE.map(([item, min, max]) => {
    const [lo, hi] = [yards(min), yards(max)];
    return { item, yards: lo === hi ? `${lo} yd` : `${lo}–${hi} yd` };
  });

  const notes = [`Based on this fabric's ${width}" width${repeat ? ` and ${repeat}" pattern repeat` : ''}.`];
  if (repeatFactor > 1) notes.push(`The amounts include about ${Math.round((repeatFactor - 1) * 100)}% extra to match the pattern across cushions and seams.`);
  notes.push('These are typical amounts. Sizes and styles vary, so confirm the exact yardage with your upholsterer before you order.');
  return { rows, notes };
}
