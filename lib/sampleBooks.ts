// Charlotte sample book names and their pages (/sample-books/<slug>). Shared by the server (page
// generation) and the browser (links from the sample books list and fabric pages).

// "Chenille Classics V & Ring Book Page #20" -> "Chenille Classics V" (also "and", "Ringbook").
export const cleanBookName = (name: string) => name.replace(/\s*(?:&|and)\s*Ring\s*book Page\s*#?\s*\w+\s*$/i, '').trim();

// A loose "Ring Book Page #19" / "Ringbook Page #13b" entry: not a real book, so it gets no page.
export const isRingBookPage = (name: string) => /^ring\s*book page/i.test(cleanBookName(name));

export const sampleBookSlug = (name: string) =>
  cleanBookName(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// The book's page, from either its clean or raw name. (Two names that differ only in punctuation would
// share a slug; lib/collections/catalogIndex.ts numbers the second. No such pair exists today.)
// Loose "Ring Book Page #19" entries aren't real books and have no page; they keep the shop filter.
export const sampleBookHref = (name: string) =>
  isRingBookPage(name) ? `/fabrics?sampleBook=${encodeURIComponent(name)}` : `/sample-books/${sampleBookSlug(name)}`;

// Books with fewer fabrics than this still get a page, but it stays out of search results.
export const SAMPLE_BOOK_MIN_INDEXED = 6;
