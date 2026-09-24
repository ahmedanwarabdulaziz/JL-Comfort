import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase/client';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';

// Small, cached summaries of the fabric catalog for the homepage: the collections (sample books) to
// feature and a representative photo per material. Recomputed at most every 30 minutes, so the
// homepage never pages through the whole catalog on a visit.

export interface HomeCollection {
  name: string; // raw sample book name (used in the /fabrics?sampleBook= link)
  count: number;
  photos: string[]; // cover first, then swatch edges
}

export interface HomeMaterial {
  value: string; // material facet slug, used in /fabrics?material=
  label: string;
  photo: string | null;
  count: number;
}

export interface HomeCatalog {
  collections: HomeCollection[];
  materials: HomeMaterial[];
}

// Materials shown on the homepage, in order. Hand-picked photos (checked by eye for visible texture)
// win over the automatic pick.
const FEATURED_MATERIALS: { value: string; label: string; photo?: string }[] = [
  { value: 'velvet', label: 'Velvet', photo: 'https://www.charlottefabrics.com/wp-content/uploads/2023/12/10150-05_Large-v1.jpg' },
  { value: 'linen', label: 'Linen', photo: 'https://www.charlottefabrics.com/wp-content/uploads/2023/12/20420-01_Large-v1.jpg' },
  { value: 'boucle', label: 'Bouclé', photo: 'https://www.charlottefabrics.com/wp-content/uploads/2023/12/CB800-450_Large-v1.jpg' },
  { value: 'chenille', label: 'Chenille', photo: 'https://www.charlottefabrics.com/wp-content/uploads/2023/12/CB700-421_Large-v3.jpg' },
  { value: 'crypton', label: 'Performance' },
  { value: 'tweed-textures', label: 'Tweed & textures' },
  { value: 'woven-patterns', label: 'Woven patterns' },
  { value: 'prints', label: 'Prints' },
];

const COLLECTION_COUNT = 8;

async function loadHomeCatalog(): Promise<HomeCatalog> {
  if (!supabase) return { collections: [], materials: [] };
  const client = supabase;

  const rows = await fetchAllRows<any>(() =>
    client
      .from('charlotte_fabrics')
      .select('image_url, image_ok, sample_books, material, is_new')
      .eq('status', 'active')
      .neq('image_url', '')
  );
  const usable = rows.filter((r) => r.image_url && r.image_ok !== false);

  // Collections: favour books with new fabrics, then the largest.
  const books = new Map<string, { count: number; newCount: number; photos: string[] }>();
  for (const row of usable) {
    for (const raw of row.sample_books || []) {
      const name = String(raw).trim();
      if (!name) continue;
      const book = books.get(name) || { count: 0, newCount: 0, photos: [] };
      book.count++;
      if (row.is_new) book.newCount++;
      if (book.photos.length < 7) book.photos.push(row.image_url);
      books.set(name, book);
    }
  }
  const collections = Array.from(books.entries())
    .sort((a, b) => b[1].newCount - a[1].newCount || b[1].count - a[1].count)
    .slice(0, COLLECTION_COUNT)
    .map(([name, book]) => ({ name, count: book.count, photos: book.photos }));

  const materials = FEATURED_MATERIALS.map((m) => {
    const matching = usable.filter((r) => (r.material || []).includes(m.value));
    return { value: m.value, label: m.label, photo: m.photo || matching[0]?.image_url || null, count: matching.length };
  }).filter((m) => m.count > 0);

  return { collections, materials };
}

export const getHomeCatalog = unstable_cache(loadHomeCatalog, ['home-catalog-v1'], { revalidate: 1800 });
