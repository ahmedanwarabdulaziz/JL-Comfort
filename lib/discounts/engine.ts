import { ShippingLine } from '@/lib/types/checkout';
import { AppliedDiscount, Discount } from '@/lib/types/discount';

// Pure discount maths, shared by the quote and checkout. No database access here.
// (Own toCents: lib/checkout/pricing imports this file, so importing back would be circular.)
const toCents = (dollars: number): number => Math.round(dollars * 100);

/** A cart line as the discount rules see it (PricedLine satisfies this). */
export interface DiscountLine extends ShippingLine {
  sampleBooks?: string[];
}

const isFabric = (line: DiscountLine) => line.kind === 'fabric' || line.kind === 'vinyl';

export const eligibleLines = (discount: Discount, lines: DiscountLine[]): DiscountLine[] => {
  switch (discount.appliesTo) {
    case 'all':
      return lines;
    case 'fabric':
      return lines.filter(isFabric);
    case 'foam':
      return lines.filter((l) => l.kind === 'foam');
    case 'bench_cushion':
      return lines.filter((l) => l.kind === 'benchCushion');
    case 'sample_books': {
      const books = new Set(discount.appliesToBooks.map((b) => b.trim().toLowerCase()));
      return lines.filter((l) => isFabric(l) && (l.sampleBooks || []).some((b) => books.has(b.trim().toLowerCase())));
    }
  }
};

export type Evaluation = { ok: true; applied: AppliedDiscount } | { ok: false; reason: string };

/**
 * Checks a discount's cart conditions (what it applies to, minimums) and works out its value.
 * Availability (dates, usage limits, per-customer) is checked separately, against the database.
 */
export function evaluateDiscount(discount: Discount, lines: DiscountLine[], label: string, codeId: string | null): Evaluation {
  const eligible = eligibleLines(discount, lines);
  if (eligible.length === 0) return { ok: false, reason: `${label} doesn't apply to the items in your cart.` };

  const eligibleCents = eligible.reduce((sum, line) => sum + line.amountCents, 0);
  if (discount.minSubtotal != null && eligibleCents < toCents(discount.minSubtotal)) {
    return { ok: false, reason: `${label} needs a minimum of $${discount.minSubtotal.toFixed(2)} CAD${discount.appliesTo === 'all' ? '' : ' of eligible items'}.` };
  }
  if (discount.minYards != null) {
    const yards = eligible.filter(isFabric).reduce((sum, line) => sum + line.quantity, 0);
    if (yards < discount.minYards) return { ok: false, reason: `${label} needs at least ${discount.minYards} yards of fabric.` };
  }

  const amountCents =
    discount.type === 'percentage'
      ? Math.round((eligibleCents * Math.min(discount.value, 100)) / 100)
      : discount.type === 'fixed_amount'
      ? Math.min(toCents(discount.value), eligibleCents)
      : 0;

  return {
    ok: true,
    applied: { discountId: discount.id, codeId, label, type: discount.type, amountCents, freeShipping: discount.type === 'free_shipping' },
  };
}

/** Total a discount saves, for picking the best automatic discount. */
export const savings = (applied: AppliedDiscount, shippingCents: number) => applied.amountCents + (applied.freeShipping ? shippingCents : 0);

/**
 * Splits a discount across amounts in proportion to their size, in whole cents that add up exactly
 * (largest remainder). Stripe spreads an order-level coupon across every line item the same way,
 * so tax computed on the discounted lines here matches what Stripe charges.
 */
export function allocate(amounts: number[], discountCents: number): number[] {
  const total = amounts.reduce((sum, a) => sum + a, 0);
  if (discountCents <= 0 || total <= 0) return amounts.map(() => 0);
  const exact = amounts.map((a) => (discountCents * a) / total);
  const shares = exact.map(Math.floor);
  let left = discountCents - shares.reduce((sum, s) => sum + s, 0);
  const order = exact.map((value, i) => ({ i, frac: value - Math.floor(value) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; left > 0 && k < order.length; k++, left--) shares[order[k].i]++;
  return shares;
}
