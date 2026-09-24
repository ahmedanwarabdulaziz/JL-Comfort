import { supabaseAdmin } from '@/lib/supabase/admin';
import { AppliedDiscount, Discount, DiscountCode, normalizeCode, rowToDiscount, rowToDiscountCode } from '@/lib/types/discount';
import { DiscountLine, evaluateDiscount, savings } from '@/lib/discounts/engine';

// Server-only discount lookups (service role: codes and redemptions are not public).

const db = () => {
  if (!supabaseAdmin) throw new Error('Supabase service role is not configured');
  return supabaseAdmin;
};

const INVALID = "That code isn't valid.";

async function countRedemptions(filter: { discountId?: string; codeId?: string; email?: string }): Promise<number> {
  let query = db().from('discount_redemptions').select('id', { count: 'exact', head: true });
  if (filter.discountId) query = query.eq('discount_id', filter.discountId);
  if (filter.codeId) query = query.eq('code_id', filter.codeId);
  if (filter.email) query = query.ilike('customer_email', filter.email.replace(/[\\%_]/g, (c) => `\\${c}`));
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/**
 * Whether a discount can be used right now by this customer: enabled, inside its dates, under its
 * usage limits. `email` is optional on the shipping page (typed later) and enforced at checkout.
 */
async function availability(discount: Discount, code: DiscountCode | null, label: string, email?: string, now = new Date()): Promise<string | null> {
  if (!discount.enabled) return code ? INVALID : `${label} isn't available.`;
  if (discount.startsAt > now) return code ? INVALID : `${label} hasn't started yet.`;
  if (discount.endsAt && discount.endsAt <= now) return `${label} has expired.`;
  if (discount.usageLimit != null && (await countRedemptions({ discountId: discount.id })) >= discount.usageLimit) {
    return `${label} has reached its usage limit.`;
  }
  if (code?.usageLimit != null && (await countRedemptions({ codeId: code.id })) >= code.usageLimit) {
    return code.usageLimit === 1 ? `${label} has already been used.` : `${label} has reached its usage limit.`;
  }
  if (discount.oncePerCustomer && email && (await countRedemptions({ discountId: discount.id, email: email.trim() })) > 0) {
    return `You've already used ${label}.`;
  }
  return null;
}

async function bestAutomatic(lines: DiscountLine[], shippingCents: number, email?: string): Promise<AppliedDiscount | null> {
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from('discounts')
    .select('*')
    .eq('method', 'automatic')
    .eq('enabled', true)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`);
  if (error) throw error;

  let best: AppliedDiscount | null = null;
  for (const discount of (data || []).map(rowToDiscount)) {
    const evaluation = evaluateDiscount(discount, lines, discount.title, null);
    if (!evaluation.ok) continue;
    if (await availability(discount, null, discount.title, email)) continue;
    if (!best || savings(evaluation.applied, shippingCents) > savings(best, shippingCents)) best = evaluation.applied;
  }
  return best;
}

/**
 * The discount for an order: the customer's code if it's valid, otherwise the best automatic
 * discount (one discount per order). An invalid code comes back as `error` alongside any automatic
 * discount, so the shopper sees why their code didn't work.
 */
export async function resolveDiscount(options: {
  code?: string;
  email?: string;
  lines: DiscountLine[];
  shippingCents: number;
}): Promise<{ applied: AppliedDiscount | null; error?: string }> {
  const code = normalizeCode(options.code);
  let error: string | undefined;

  if (code) {
    const { data, error: lookupError } = await db().from('discount_codes').select('*, discounts(*)').eq('code', code).maybeSingle();
    if (lookupError) throw lookupError;
    if (!data?.discounts || data.discounts.method !== 'code') {
      error = INVALID;
    } else {
      const discount = rowToDiscount(data.discounts);
      const codeRow = rowToDiscountCode(data);
      error = (await availability(discount, codeRow, code, options.email)) || undefined;
      if (!error) {
        const evaluation = evaluateDiscount(discount, options.lines, code, codeRow.id);
        if (evaluation.ok) return { applied: evaluation.applied };
        error = evaluation.reason;
      }
    }
  }

  return { applied: await bestAutomatic(options.lines, options.shippingCents, options.email), error };
}

/** Records that a paid order used its discount. Safe to call twice (one row per order). */
export async function recordRedemption(orderId: string) {
  const { data: order, error } = await db()
    .from('orders')
    .select('id, customer_email, discount_id, discount_code_id, discount_cents')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order?.discount_id) return;
  const { error: insertError } = await db()
    .from('discount_redemptions')
    .upsert(
      {
        discount_id: order.discount_id,
        code_id: order.discount_code_id,
        order_id: order.id,
        customer_email: order.customer_email,
        amount_cents: order.discount_cents,
      },
      { onConflict: 'order_id', ignoreDuplicates: true }
    );
  if (insertError) throw insertError;
}
