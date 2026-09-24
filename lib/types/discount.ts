export type DiscountMethod = 'code' | 'automatic';
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type DiscountAppliesTo = 'all' | 'fabric' | 'foam' | 'bench_cushion' | 'sample_books';

export interface Discount {
  id: string;
  title: string;
  method: DiscountMethod;
  type: DiscountType;
  value: number; // percent (15 = 15%) or CAD amount; unused for free shipping
  appliesTo: DiscountAppliesTo;
  appliesToBooks: string[];
  minSubtotal: number | null;
  minYards: number | null;
  usageLimit: number | null;
  oncePerCustomer: boolean;
  startsAt: Date;
  endsAt: Date | null;
  enabled: boolean;
  createdAt: Date;
}

export interface DiscountCode {
  id: string;
  discountId: string;
  code: string;
  usageLimit: number | null;
  createdAt: Date;
}

/** What a quote/order carries once a discount has been accepted. */
export interface AppliedDiscount {
  discountId: string;
  codeId: string | null;
  label: string; // the code, or the title for automatic discounts
  type: DiscountType;
  amountCents: number; // off the items (0 for free shipping)
  freeShipping: boolean;
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage off',
  fixed_amount: 'Fixed amount off',
  free_shipping: 'Free shipping',
};

export const APPLIES_TO_LABELS: Record<DiscountAppliesTo, string> = {
  all: 'Entire order',
  fabric: 'Fabric only',
  foam: 'Foam only',
  bench_cushion: 'Bench cushions only',
  sample_books: 'Specific collections',
};

export type DiscountStatus = 'active' | 'scheduled' | 'expired' | 'disabled';

export const discountStatus = (d: Pick<Discount, 'enabled' | 'startsAt' | 'endsAt'>, now = new Date()): DiscountStatus => {
  if (!d.enabled) return 'disabled';
  if (d.startsAt > now) return 'scheduled';
  if (d.endsAt && d.endsAt <= now) return 'expired';
  return 'active';
};

/** "15% off fabric", "$20 off entire order", "Free shipping" — for admin lists and the storefront. */
export const describeDiscount = (d: Pick<Discount, 'type' | 'value' | 'appliesTo'>) => {
  const scope = d.appliesTo === 'all' ? 'entire order' : APPLIES_TO_LABELS[d.appliesTo].replace(' only', '').toLowerCase();
  if (d.type === 'free_shipping') return 'Free shipping';
  if (d.type === 'percentage') return `${Number(d.value)}% off ${scope}`;
  return `$${Number(d.value).toFixed(2)} off ${scope}`;
};

const date = (value: any): Date | null => (value ? new Date(value) : null);

export const rowToDiscount = (row: any): Discount => ({
  id: row.id,
  title: row.title,
  method: row.method,
  type: row.type,
  value: Number(row.value ?? 0),
  appliesTo: row.applies_to,
  appliesToBooks: row.applies_to_books || [],
  minSubtotal: row.min_subtotal == null ? null : Number(row.min_subtotal),
  minYards: row.min_yards ?? null,
  usageLimit: row.usage_limit ?? null,
  oncePerCustomer: !!row.once_per_customer,
  startsAt: new Date(row.starts_at),
  endsAt: date(row.ends_at),
  enabled: row.enabled ?? true,
  createdAt: new Date(row.created_at),
});

export const rowToDiscountCode = (row: any): DiscountCode => ({
  id: row.id,
  discountId: row.discount_id,
  code: row.code,
  usageLimit: row.usage_limit ?? null,
  createdAt: new Date(row.created_at),
});

/** Codes are stored upper-case; customers can type them any way. */
export const normalizeCode = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
