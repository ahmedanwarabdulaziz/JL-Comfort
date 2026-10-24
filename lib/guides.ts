// Buying guides under /guides. Each is a real page in app/guides/<slug>; this list feeds the
// /guides index, the sitemap and the footer, so a new guide only needs adding here and its page.

export interface Guide {
  slug: string;
  title: string; // the page's H1
  metaTitle: string; // <title>, before " | JL Comfort"
  description: string; // meta description and the card text on /guides, ~150 characters
  published: string; // ISO date
  updated: string; // ISO date; bump when the content changes
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
  },
];

export const guideHref = (slug: string) => `/guides/${slug}`;
export const getGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug);
