import { supabase } from '@/lib/supabase/client';
import { fetchAllRows } from '@/lib/supabase/fetchAllRows';
import { Discount, DiscountCode, normalizeCode, rowToDiscount, rowToDiscountCode } from '@/lib/types/discount';

// Admin-side discount management through the signed-in admin's session (RLS: admin_users only).

export type DiscountInput = Omit<Discount, 'id' | 'createdAt'>;

export interface DiscountSummary extends Discount {
  codes: DiscountCode[];
  codeCount: number;
  uses: number;
  savedCents: number;
}

export interface Redemption {
  id: string;
  orderId: string;
  orderNumber: string | null;
  code: string | null;
  email: string;
  amountCents: number;
  createdAt: Date;
}

const db = () => {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
};

const toRow = (input: DiscountInput) => ({
  title: input.title.trim(),
  method: input.method,
  type: input.type,
  value: input.type === 'free_shipping' ? 0 : input.value,
  applies_to: input.appliesTo,
  applies_to_books: input.appliesTo === 'sample_books' ? input.appliesToBooks : [],
  min_subtotal: input.minSubtotal,
  min_yards: input.minYards,
  usage_limit: input.usageLimit,
  once_per_customer: input.oncePerCustomer,
  starts_at: input.startsAt.toISOString(),
  ends_at: input.endsAt ? input.endsAt.toISOString() : null,
  enabled: input.enabled,
});

export async function getDiscounts(): Promise<DiscountSummary[]> {
  const [{ data, error }, redemptions] = await Promise.all([
    db().from('discounts').select('*, discount_codes(*)').order('created_at', { ascending: false }),
    fetchAllRows<any>(() => db().from('discount_redemptions').select('id, discount_id, amount_cents')),
  ]);
  if (error) throw error;

  const usage = new Map<string, { uses: number; saved: number }>();
  for (const r of redemptions) {
    const u = usage.get(r.discount_id) || { uses: 0, saved: 0 };
    u.uses++;
    u.saved += r.amount_cents || 0;
    usage.set(r.discount_id, u);
  }

  return (data || []).map((row: any) => {
    const codes = (row.discount_codes || []).map(rowToDiscountCode).sort((a: DiscountCode, b: DiscountCode) => a.code.localeCompare(b.code));
    const u = usage.get(row.id) || { uses: 0, saved: 0 };
    return { ...rowToDiscount(row), codes, codeCount: codes.length, uses: u.uses, savedCents: u.saved };
  });
}

/** Creates or updates a discount. For a new code discount, `firstCode` becomes its code. */
export async function saveDiscount(id: string | null, input: DiscountInput, firstCode?: string): Promise<string> {
  if (id) {
    const { error } = await db().from('discounts').update(toRow(input)).eq('id', id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await db().from('discounts').insert(toRow(input)).select('id').single();
  if (error) throw error;
  if (input.method === 'code' && firstCode) {
    try {
      await addCode(data.id, firstCode, null);
    } catch (codeError) {
      await db().from('discounts').delete().eq('id', data.id); // don't leave a code discount with no code
      throw codeError;
    }
  }
  return data.id;
}

export async function deleteDiscount(id: string) {
  const { error } = await db().from('discounts').delete().eq('id', id);
  if (error) throw error;
}

const friendlyCodeError = (error: any) =>
  error?.code === '23505' ? new Error('That code is already used by another discount.') : error;

export async function addCode(discountId: string, code: string, usageLimit: number | null) {
  const normalized = normalizeCode(code);
  if (!/^[A-Z0-9_-]{3,40}$/.test(normalized)) throw new Error('Codes are 3 to 40 letters, numbers, dashes or underscores.');
  const { error } = await db().from('discount_codes').insert({ discount_id: discountId, code: normalized, usage_limit: usageLimit });
  if (error) throw friendlyCodeError(error);
}

export async function deleteCode(codeId: string) {
  const { error } = await db().from('discount_codes').delete().eq('id', codeId);
  if (error) throw error;
}

// No 0/O or 1/I, so codes read back correctly over the phone or from print.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const randomCode = (length = 8) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
};

/** Generates `count` unique codes like PREFIX-7K3F9Q2M, each usable `usageLimit` times. */
export async function generateCodes(discountId: string, prefix: string, count: number, usageLimit: number | null): Promise<string[]> {
  const cleanPrefix = normalizeCode(prefix).replace(/-+$/, '');
  if (cleanPrefix && !/^[A-Z0-9_-]{1,20}$/.test(cleanPrefix)) throw new Error('The prefix can only use letters, numbers, dashes or underscores (up to 20).');
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Generate between 1 and 1,000 codes at a time.');

  const created: string[] = [];
  let attempts = 0;
  while (created.length < count && attempts < 5) {
    attempts++;
    const batch = Array.from(new Set(Array.from({ length: count - created.length }, () => (cleanPrefix ? `${cleanPrefix}-` : '') + randomCode(8))));
    const { data, error } = await db()
      .from('discount_codes')
      .upsert(batch.map((code) => ({ discount_id: discountId, code, usage_limit: usageLimit })), { onConflict: 'code', ignoreDuplicates: true })
      .select('code');
    if (error) throw error;
    created.push(...(data || []).map((row: any) => row.code));
  }
  return created;
}

export async function getRedemptions(discountId: string): Promise<Redemption[]> {
  const { data, error } = await db()
    .from('discount_redemptions')
    .select('id, order_id, customer_email, amount_cents, created_at, orders(order_number), discount_codes(code)')
    .eq('discount_id', discountId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number ?? null,
    code: row.discount_codes?.code ?? null,
    email: row.customer_email,
    amountCents: row.amount_cents,
    createdAt: new Date(row.created_at),
  }));
}

/** Code usage counts, for the codes table. */
export async function getCodeUses(discountId: string): Promise<Record<string, number>> {
  const rows = await fetchAllRows<any>(() => db().from('discount_redemptions').select('id, code_id').eq('discount_id', discountId));
  const uses: Record<string, number> = {};
  for (const row of rows) if (row.code_id) uses[row.code_id] = (uses[row.code_id] || 0) + 1;
  return uses;
}

/** Every sample book name in the catalog, for "applies to specific collections". */
export async function getSampleBookNames(): Promise<string[]> {
  const rows = await fetchAllRows<any>(() => db().from('charlotte_fabrics').select('id, sample_books').eq('status', 'active'));
  const names = new Set<string>();
  for (const row of rows) for (const book of row.sample_books || []) if (book?.trim()) names.add(book.trim());
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}
