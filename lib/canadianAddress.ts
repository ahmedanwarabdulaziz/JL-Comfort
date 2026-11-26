// We only ship within Canada. Used by the sample request form and its server check.
import { CHECKOUT_REGIONS } from './checkout/regions';

export const PROVINCES = CHECKOUT_REGIONS.CA;

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** The two-letter code for a province given as a code or a name ("on", "Québec"), else null. */
export function provinceCode(value: string): string | null {
  const wanted = plain(value);
  const match = PROVINCES.find(([code, name]) => plain(code) === wanted || plain(name) === wanted);
  return match ? match[0] : null;
}

/** "l9t8l2" -> "L9T 8L2"; null if it isn't a Canadian postal code. */
export function formatPostalCode(value: string): string | null {
  const compact = value.replace(/[\s-]/g, '').toUpperCase();
  return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact) ? `${compact.slice(0, 3)} ${compact.slice(3)}` : null;
}

export const isCanada = (country: string) => ['canada', 'ca'].includes(plain(country));
