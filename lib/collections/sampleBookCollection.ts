import type { FabricCollection } from './definitions';
import { getSampleBook, type SampleBookEntry } from './catalogIndex';
import { CHARLOTTE_BRAND_ENABLED } from '@/lib/site';
import { SAMPLE_BOOK_MIN_INDEXED } from '@/lib/sampleBooks';

// A Charlotte sample book as a collection page (/sample-books/<slug>), with copy written from what's
// actually in the book: its fabric types, colours and how much of it is performance or outdoor fabric.

const TYPE_WORDS: Record<string, string> = {
  velvet: 'velvet', chenille: 'chenille', boucle: 'bouclé', linen: 'linen and linen-look fabric', 'tweed-textures': 'textured weaves',
  crypton: 'Crypton performance fabric', 'microfiber-microsuede': 'microsuede', 'canvas-denim-twill': 'canvas, denim and twill',
  tapestry: 'tapestry', matelasse: 'matelassé', shearling: 'faux shearling', metallic: 'metallic fabric', embroidery: 'embroidered fabric',
  prints: 'printed fabric', 'woven-patterns': 'woven patterns', 'faux-wool': 'faux wool', 'faux-silk': 'faux silk',
};
const COLOUR_WORDS: Record<string, string> = {
  'red-burgundy': 'red', 'orange-rust': 'rust', 'gold-yellow': 'gold', green: 'green', 'aqua-teal': 'teal', blue: 'blue',
  purple: 'purple', 'coral-peach': 'coral', pink: 'pink', 'beige-taupe': 'beige', brown: 'brown', black: 'black',
  'grey-silver': 'grey', 'white-ivory': 'ivory',
};
// The type collection page a book mostly belongs to, for the "related" links.
const TYPE_COLLECTION: Record<string, string> = {
  velvet: 'velvet', chenille: 'chenille', boucle: 'boucle', linen: 'linen', 'tweed-textures': 'tweed', crypton: 'crypton',
  'microfiber-microsuede': 'microsuede', 'canvas-denim-twill': 'canvas-denim', tapestry: 'tapestry', matelasse: 'matelasse',
  shearling: 'shearling', metallic: 'metallic', embroidery: 'embroidered', prints: 'printed', 'woven-patterns': 'woven',
};

const list = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

export function bookToCollection(book: SampleBookEntry): FabricCollection {
  const brand = CHARLOTTE_BRAND_ENABLED ? 'Charlotte ' : '';
  const title = `${brand}${book.name} Collection`;
  const types = book.materials.map((m) => TYPE_WORDS[m]).filter(Boolean).slice(0, 2);
  const colours = book.colours.map((c) => COLOUR_WORDS[c]).filter(Boolean);
  const fabricsWord = `${book.count} fabric${book.count === 1 ? '' : 's'}`;

  const intro = [
    `${book.name} is a ${CHARLOTTE_BRAND_ENABLED ? 'Charlotte Fabrics ' : ''}sample book of ${fabricsWord}${types.length ? `, mostly ${list(types)}` : ''}.`,
    colours.length > 3
      ? `It comes in ${colours.length} colour families, mostly ${list(colours.slice(0, 3))}.`
      : colours.length > 1
      ? `It comes in ${list(colours)}.`
      : '',
    book.outdoorShare >= 0.5
      ? 'Most of the book is made for outdoor and marine use, resisting fading, moisture and mildew.'
      : book.performanceShare >= 0.5
      ? 'Most of the book is performance fabric: stain resistant and easy to clean.'
      : '',
    book.contractShare >= 0.5 ? 'Most fabrics are also rated for commercial (contract) use.' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const typeSlugs = [...new Set(book.materials.map((m) => TYPE_COLLECTION[m]).filter(Boolean))].slice(0, 3);
  const related = [
    ...typeSlugs,
    ...(book.performanceShare >= 0.5 ? ['performance'] : []),
    ...(book.outdoorShare >= 0.5 ? ['outdoor'] : []),
    ...(CHARLOTTE_BRAND_ENABLED ? ['charlotte-fabrics'] : []),
  ].slice(0, 5);

  return {
    slug: book.slug,
    group: 'brand',
    label: book.name,
    title,
    metaTitle: `${title}: Upholstery Fabric by the Yard`,
    description: `Shop the ${brand}${book.name} collection: ${fabricsWord}${types.length ? `, mostly ${types[0]}` : ''}, by the yard. Free samples, prices in CAD, shipped across Canada.`.slice(0, 160),
    intro,
    sections: [
      {
        heading: `Ordering from ${book.name}`,
        body: `Every fabric in the ${book.name} book is sold by the yard and priced in Canadian dollars. Order free samples of the colours you like first: screens never show colour and texture exactly, and a swatch lets you see each one in your own light. When you're ready, order the full yardage at once so it comes from the same dye lot.`,
      },
    ],
    rule: { sampleBooks: book.raws },
    related,
    basePath: '/sample-books',
    parent: { label: 'Sample Books', href: '/sample-books' },
    noindex: book.count < SAMPLE_BOOK_MIN_INDEXED,
  };
}

export async function sampleBookCollection(slug: string): Promise<FabricCollection | undefined> {
  const book = await getSampleBook(slug);
  return book ? bookToCollection(book) : undefined;
}
