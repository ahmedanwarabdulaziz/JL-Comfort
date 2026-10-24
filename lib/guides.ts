// Buying guides under /guides. This list feeds the /guides index, the sitemap, the "related guides"
// links on collection and fabric pages, and app/guides/[slug]. Each guide's article text lives in
// content/guides/<slug>.md (format: lib/guideContent.ts). "How much fabric do I need?" is the one
// exception: it has its own page (app/guides/how-much-fabric-do-i-need) for the calculator.

export interface Guide {
  slug: string;
  title: string; // the page's H1
  metaTitle: string; // <title>, before " | JL Comfort"
  description: string; // meta description and the card text on /guides, ~150 characters
  published: string; // ISO date
  updated: string; // ISO date; bump when the content changes
  collections: string[]; // collection slugs the guide is about: shop links, and where it's linked from
  custom?: boolean; // has its own page instead of content/guides/<slug>.md
}

export const GUIDES: Guide[] = [
  {
    slug: 'how-much-fabric-do-i-need',
    title: 'How Much Fabric Do I Need?',
    metaTitle: 'How Much Upholstery Fabric Do I Need? Yardage Chart & Calculator',
    description:
      'How many yards of upholstery fabric you need for a chair, sofa, ottoman, headboard or curtains, with a yardage chart and calculator for 54" fabric.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: [],
    custom: true,
  },
  {
    slug: 'how-to-choose-upholstery-fabric',
    title: 'How to Choose Upholstery Fabric',
    metaTitle: 'How to Choose Upholstery Fabric: A Complete Buying Guide',
    description:
      'Choose upholstery fabric with confidence: fibre, weave, durability, cleaning codes, colour and pattern, explained for sofas, chairs and cushions.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['performance', 'heavy-duty', 'linen', 'tweed'],
  },
  {
    slug: 'double-rubs-explained',
    title: 'Double Rubs Explained: How Durable Should Upholstery Fabric Be?',
    metaTitle: 'Double Rubs Explained: Upholstery Fabric Durability Guide',
    description:
      'What double rubs (Wyzenbeek) and Martindale ratings mean, how many you need for a sofa, dining chairs or commercial seating, and what else affects wear.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['heavy-duty', 'commercial', 'performance'],
  },
  {
    slug: 'upholstery-cleaning-codes',
    title: 'Upholstery Cleaning Codes: W, S, W/S and X Explained',
    metaTitle: 'Upholstery Cleaning Codes W, S, W/S, X Explained',
    description:
      'What the cleaning code on your upholstery fabric means, how to spot clean each type safely, and which fabrics are bleach cleanable.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['bleach-cleanable', 'performance', 'crypton'],
  },
  {
    slug: 'best-pet-friendly-sofa-fabric',
    title: 'The Best Pet-Friendly Sofa Fabric',
    metaTitle: 'Best Pet-Friendly Sofa Fabric for Dogs and Cats',
    description:
      'Which upholstery fabrics stand up to claws, fur and accidents, which to avoid, and how to choose a colour and cleaning code that suits life with pets.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['pet-friendly', 'microsuede', 'crypton', 'performance'],
  },
  {
    slug: 'crypton-vs-performance-fabric',
    title: 'Crypton vs. Performance Fabric: What’s the Difference?',
    metaTitle: 'Crypton vs. Performance Fabric: Which Should You Choose?',
    description:
      'How Crypton differs from other performance and stain-resistant upholstery fabrics, what each protects against, and which suits your home.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['crypton', 'performance', 'bleach-cleanable'],
  },
  {
    slug: 'outdoor-cushion-fabric-canada',
    title: 'Outdoor Cushion Fabric for Canadian Weather',
    metaTitle: 'Outdoor Cushion Fabric for Canadian Summers and Winters',
    description:
      'Choosing outdoor fabric that handles Canadian sun, rain and humidity, plus how to clean and store cushions so they last through the winter.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['outdoor', 'marine', 'bench-cushion', 'canvas-denim', 'striped'],
  },
  {
    slug: 'velvet-vs-chenille-vs-boucle',
    title: 'Velvet vs. Chenille vs. Bouclé',
    metaTitle: 'Velvet vs. Chenille vs. Bouclé Upholstery Fabric Compared',
    description:
      'How velvet, chenille and bouclé compare for look, feel, durability, pets and cleaning, and which suits a sofa, accent chair or headboard.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['velvet', 'chenille', 'boucle', 'headboard'],
  },
  {
    slug: 'railroaded-vs-up-the-roll',
    title: 'Railroaded vs. Up-the-Roll Fabric',
    metaTitle: 'Railroaded vs. Up-the-Roll Upholstery Fabric Explained',
    description:
      'What railroaded and up-the-roll mean on a fabric spec sheet, why it matters for sofas, benches and headboards, and how it changes yardage.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['striped', 'woven', 'bench-cushion', 'headboard'],
  },
  {
    slug: 'best-fabric-for-dining-chairs',
    title: 'The Best Fabric for Dining Chairs',
    metaTitle: 'Best Fabric for Dining Chairs: Durable, Cleanable Choices',
    description:
      'What to look for in dining chair fabric: durability, cleanability and texture, how much you need per chair, and the best fabric types for spills.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['performance', 'bleach-cleanable', 'microsuede'],
  },
  {
    slug: 'commercial-upholstery-fabric-guide',
    title: 'Choosing Commercial Upholstery Fabric',
    metaTitle: 'Commercial Upholstery Fabric for Restaurants, Offices and Clinics',
    description:
      'How to choose contract-grade fabric for restaurants, offices, hotels and clinics: durability ratings, cleanability, flammability standards and more.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: ['commercial', 'banquette', 'healthcare', 'heavy-duty', 'fire-rated'],
  },
  {
    slug: 'upholstery-fabric-glossary',
    title: 'Upholstery Fabric Glossary',
    metaTitle: 'Upholstery Fabric Glossary: Trade Terms Explained A to Z',
    description:
      'Upholstery fabric terms explained in plain language: double rubs, railroaded, repeat, selvage, solution-dyed, cleaning codes, nap and more.',
    published: '2026-10-25',
    updated: '2026-10-25',
    collections: [],
  },
];

export const guideHref = (slug: string) => `/guides/${slug}`;
export const getGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug);

// Guides about a collection, for that collection's page ("Helpful guides").
export const guidesForCollection = (collectionSlug: string) => GUIDES.filter((g) => g.collections.includes(collectionSlug));

// Other guides sharing a collection with this one first, then the rest.
export function relatedGuides(slug: string, limit = 3): Guide[] {
  const guide = getGuide(slug);
  const others = GUIDES.filter((g) => g.slug !== slug);
  const score = (g: Guide) => g.collections.filter((c) => guide?.collections.includes(c)).length;
  return [...others].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
