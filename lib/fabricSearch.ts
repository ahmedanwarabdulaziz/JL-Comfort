// Shop search. Every word typed must match something about the fabric, in any order:
//   - a word with a digit is a pattern number: matched anywhere in the name or SKU ("2215" -> D2215)
//   - any other word must start a word of the name, colour, type, pattern or feature tags, so
//     "blue velvet" works and "red" doesn't match "textured".
// No imports, so it can be tested with plain node.

export interface SearchableFabric {
  name: string;
  sku: string;
  color?: string[];
  material?: string[];
  pattern?: string[];
  properties?: string[];
  markets?: string[];
  fiberContent?: string;
}

// Words that describe everything we sell, so they shouldn't narrow the results.
const IGNORED = new Set(['fabric', 'fabrics', 'upholstery', 'material', 'color', 'colour', 'and', 'the', 'a', 'for', 'with', 'by', 'yard']);
const SAME_AS: Record<string, string> = { gray: 'grey', stripes: 'stripe', striped: 'stripe', plaids: 'plaid' };

const normalise = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const wordsOf = (text: string) => normalise(text).split(/[^a-z0-9]+/).filter(Boolean);

const cache = new WeakMap<SearchableFabric, { code: string; words: string[] }>();

function indexOf(fabric: SearchableFabric) {
  let entry = cache.get(fabric);
  if (!entry) {
    const tags = [fabric.color, fabric.material, fabric.pattern, fabric.properties, fabric.markets].flatMap((list) => list || []);
    entry = {
      code: normalise(`${fabric.name} ${fabric.sku}`),
      words: wordsOf(`${fabric.name} ${fabric.sku} ${tags.join(' ')} ${fabric.fiberContent || ''}`),
    };
    cache.set(fabric, entry);
  }
  return entry;
}

const matchesWord = (words: string[], term: string) => {
  const wanted = SAME_AS[term] || term;
  const singular = wanted.length > 3 && wanted.endsWith('s') ? wanted.slice(0, -1) : wanted;
  return words.some((word) => word.startsWith(singular));
};

/** Returns a test for one search box value; an empty search matches everything. */
export function fabricSearchMatcher(search: string): (fabric: SearchableFabric) => boolean {
  const text = normalise(search).trim();
  if (!text) return () => true;
  const terms = text.split(/\s+/).flatMap((chunk) => (/\d/.test(chunk) ? [chunk] : wordsOf(chunk))).filter((term) => !IGNORED.has(term));
  if (terms.length === 0) return () => true;
  return (fabric) => {
    const { code, words } = indexOf(fabric);
    // The whole text as typed still finds a name or SKU, as before.
    if (code.includes(text)) return true;
    return terms.every((term) => (/\d/.test(term) ? code.includes(term) : matchesWord(words, term)));
  };
}
