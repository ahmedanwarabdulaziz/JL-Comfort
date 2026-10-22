import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

// Square, as a stand-in for Stripe while the Stripe account is being set up (PAYMENT_PROVIDER=square).
// Talks to Square's REST API directly rather than through its SDK: checkout needs three calls.
// Production and sandbox are separate Square accounts with their own token and location, the same
// way Stripe's live and test keys are: shoppers always pay through production, admin test
// checkouts (lib/stripe/testMode.ts) through the sandbox.
const SQUARE_VERSION = '2025-01-23';

const build = () => (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);

// A value pasted into the host's env settings can pick up spaces, line breaks or quotes; Square's
// tokens and ids are only letters, digits, '-' and '_'.
const clean = (raw: string | undefined) => raw?.replace(/[^A-Za-z0-9_-]/g, '') || undefined;

interface SquareAccount {
  baseUrl: string;
  token: string;
  locationId: string;
}

function accountFor(testMode: boolean): SquareAccount | null {
  const token = clean(process.env[testMode ? 'SQUARE_SANDBOX_ACCESS_TOKEN' : 'SQUARE_ACCESS_TOKEN']);
  const locationId = clean(process.env[testMode ? 'SQUARE_SANDBOX_LOCATION_ID' : 'SQUARE_LOCATION_ID']);
  if (!token || !locationId) return null;
  return {
    baseUrl: testMode ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com',
    token,
    locationId,
  };
}

export const isSquareConfigured = (testMode: boolean) => !!accountFor(testMode);

export class SquareError extends Error {}

function requireAccount(testMode: boolean): SquareAccount {
  const account = accountFor(testMode);
  if (!account) {
    throw new SquareError(
      testMode
        ? `Test payments aren't set up (SQUARE_SANDBOX_ACCESS_TOKEN or SQUARE_SANDBOX_LOCATION_ID is missing) [build ${build()}].`
        : `Payments are not set up on this server yet (SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID is missing) [build ${build()}]. Please try again shortly.`
    );
  }
  return account;
}

export const assertSquareConfigured = (testMode: boolean) => void requireAccount(testMode);

async function squareRequest<T>(testMode: boolean, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const account = requireAccount(testMode);
  const response = await fetch(`${account.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${account.token}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = (data.errors || []).map((e: any) => `${e.code}${e.field ? ` (${e.field})` : ''}: ${e.detail}`).join('; ');
    throw new SquareError(`Square ${method} ${path} failed (${response.status}): ${detail || response.statusText}`);
  }
  return data as T;
}

type Money = { amount: number; currency: string };

export interface SquareCheckoutInput {
  orderId: string;
  orderNumber: string;
  currency: string;
  lines: { name: string; description?: string; unitPriceCents: number; quantity: number }[];
  shipping: { name: string; description: string; amountCents: number } | null;
  taxes: { id: string; name: string; rate: number; appliesToShipping: boolean }[];
  discount: { name: string; amountCents: number } | null;
  buyer: { name: string; email: string; phone?: string; line1: string; line2?: string; city: string; region: string; postalCode: string; country: string };
  redirectUrl: string;
}

// Square wants an E.164 number or rejects the whole link, so a phone it might not accept is left out.
function toE164(phone: string | undefined): string | undefined {
  const digits = phone?.replace(/\D/g, '') || '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return undefined;
}

/**
 * Creates a Square payment link for an order priced by quoteCart and returns its hosted page.
 * Taxes and the discount go on the Square order the same way they went on the Stripe session:
 * every tax on the products, only shipping-taxes on the shipping line, and one order-level fixed
 * discount that Square spreads across the lines before tax (as lib/checkout/pricing.ts does).
 */
export async function createSquarePaymentLink(input: SquareCheckoutInput, testMode: boolean) {
  // "Mary Ann Smith" -> "Mary Ann" + "Smith"; a single word is a first name.
  const nameParts = input.buyer.name.trim().split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts.pop()! : '';
  const firstName = nameParts.join(' ');
  // Checked first: the request body below needs the account's location.
  const { locationId } = requireAccount(testMode);
  const money = (amount: number): Money => ({ amount, currency: input.currency.toUpperCase() });
  const taxes = input.taxes.map((tax, i) => ({
    uid: `tax-${i}`,
    name: tax.name,
    percentage: String(tax.rate),
    type: 'ADDITIVE',
    scope: 'LINE_ITEM',
    appliesToShipping: tax.appliesToShipping,
  }));
  const productTaxes = taxes.map((tax) => ({ tax_uid: tax.uid }));
  const shippingTaxes = taxes.filter((tax) => tax.appliesToShipping).map((tax) => ({ tax_uid: tax.uid }));

  const lineItems = input.lines.map((line) => ({
    name: line.name.slice(0, 512),
    note: line.description?.slice(0, 2000) || undefined,
    quantity: String(line.quantity),
    base_price_money: money(line.unitPriceCents),
    applied_taxes: productTaxes.length > 0 ? productTaxes : undefined,
  }));
  if (input.shipping) {
    lineItems.push({
      name: input.shipping.name,
      note: input.shipping.description,
      quantity: '1',
      base_price_money: money(input.shipping.amountCents),
      applied_taxes: shippingTaxes.length > 0 ? shippingTaxes : undefined,
    });
  }

  const { payment_link } = await squareRequest<{ payment_link: { id: string; url: string; order_id: string } }>(
    testMode,
    'POST',
    '/v2/online-checkout/payment-links',
    {
      idempotency_key: randomUUID(),
      description: `JL Comfort order ${input.orderNumber}`,
      order: {
        location_id: locationId,
        reference_id: input.orderId,
        line_items: lineItems,
        taxes: taxes.length > 0 ? taxes.map(({ appliesToShipping, ...tax }) => tax) : undefined,
        discounts: input.discount
          ? [{ uid: 'discount', name: input.discount.name, type: 'FIXED_AMOUNT', amount_money: money(input.discount.amountCents), scope: 'ORDER' }]
          : undefined,
        metadata: { order_id: input.orderId, order_number: input.orderNumber },
      },
      checkout_options: {
        redirect_url: input.redirectUrl,
        // The delivery address was already collected on /checkout/shipping; it decided shipping and tax.
        ask_for_shipping_address: false,
        // Discount codes are entered (and priced) on our own checkout; Square's coupon box would be a second one.
        enable_coupon: false,
      },
      pre_populated_data: {
        buyer_email: input.buyer.email,
        buyer_phone_number: toE164(input.buyer.phone),
        // Square's page always shows a contact section; filling it from our shipping form leaves only the card.
        buyer_address: {
          first_name: firstName,
          last_name: lastName || undefined,
          address_line_1: input.buyer.line1,
          address_line_2: input.buyer.line2 || undefined,
          locality: input.buyer.city,
          administrative_district_level_1: input.buyer.region,
          postal_code: input.buyer.postalCode,
          country: input.buyer.country,
        },
      },
      payment_note: `JL Comfort order ${input.orderNumber}`,
    }
  );
  return payment_link;
}

export interface SquarePaymentResult {
  orderId: string | null; // ours, from the Square order's reference_id
  orderNumber: string | null;
  squareOrderId: string;
  paymentId: string | null;
  paid: boolean;
  totalCents: number | null;
  taxCents: number | null;
}

/** Looks a Square order up at Square itself; it's paid once a tender covers the full amount. */
export async function getSquarePayment(squareOrderId: string, testMode: boolean): Promise<SquarePaymentResult> {
  const { order } = await squareRequest<{ order: any }>(testMode, 'GET', `/v2/orders/${encodeURIComponent(squareOrderId)}`);
  const tenders: any[] = order.tenders || [];
  const paid = tenders.length > 0 && (order.net_amount_due_money?.amount ?? 0) === 0 && order.state !== 'CANCELED';
  return {
    orderId: order.reference_id || order.metadata?.order_id || null,
    orderNumber: order.metadata?.order_number || null,
    squareOrderId: order.id,
    paymentId: tenders[0]?.payment_id || tenders[0]?.id || null,
    paid,
    totalCents: order.total_money?.amount ?? null,
    taxCents: order.total_tax_money?.amount ?? null,
  };
}

// Orders store the Square order id in the checkout-session column, prefixed so it can't be
// mistaken for a Stripe session (cs_...).
export const SQUARE_REF_PREFIX = 'square:';

/**
 * Checks a webhook's x-square-hmacsha256-signature: base64 HMAC-SHA256 of the notification URL
 * followed by the raw body, keyed with the subscription's signature key. Returns which account
 * the key belongs to, or null if neither matches.
 */
export function verifySquareWebhook(notificationUrl: string, body: string, signature: string): { testMode: boolean } | null {
  const candidates: [string | undefined, boolean][] = [
    [process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim(), false],
    [process.env.SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY?.trim(), true],
  ];
  const given = Buffer.from(signature);
  for (const [key, testMode] of candidates) {
    if (!key) continue;
    const expected = Buffer.from(createHmac('sha256', key).update(notificationUrl + body).digest('base64'));
    if (expected.length === given.length && timingSafeEqual(expected, given)) return { testMode };
  }
  return null;
}

export const isSquareWebhookConfigured = () =>
  !!(process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim() || process.env.SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY?.trim());
