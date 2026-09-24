import { getShippingRate } from '@/lib/data/shippingRates';
import { getRegionTaxRates } from '@/lib/data/taxRates';
import { buildQuote, computeShippingCents } from '@/lib/checkout/pricing';
import { CheckoutError } from '@/lib/checkout/errors';
import { PricedLine, priceCart } from '@/lib/checkout/serverPricing';
import { resolveDiscount } from '@/lib/discounts/server';
import { CheckoutQuote, ShippingRate, TaxRate } from '@/lib/types/checkout';
import { AppliedDiscount } from '@/lib/types/discount';
import type { CartItem } from '@/lib/context/CartContext';

export { CheckoutError };

export interface CartQuote {
  quote: CheckoutQuote;
  lines: PricedLine[];
  shippingRate: ShippingRate;
  taxRates: TaxRate[];
  discount: AppliedDiscount | null;
}

export const quoteCart = async (
  items: CartItem[],
  country: string,
  regionCode: string,
  options: { discountCode?: string; email?: string } = {}
): Promise<CartQuote> => {
  if (!Array.isArray(items) || items.length === 0) throw new CheckoutError('No items in cart');

  const shippingRate = await getShippingRate(country).catch(() => {
    throw new CheckoutError('Shipping rates are unavailable right now. Please try again shortly.', 503);
  });
  if (!shippingRate || !shippingRate.enabled) {
    throw new CheckoutError(
      country === 'CA' ? 'Canada shipping is not configured yet. Please contact JL Comfort.' : 'We do not ship to this country yet.'
    );
  }

  const [lines, taxRates] = await Promise.all([priceCart(items), getRegionTaxRates(country, regionCode)]);
  const { applied, error } = await resolveDiscount({
    code: options.discountCode,
    email: options.email,
    lines,
    shippingCents: computeShippingCents(lines, shippingRate),
  }).catch((lookupError) => {
    // A discount lookup failure must never block a sale: quote without a discount.
    console.error('Discount lookup failed:', lookupError);
    return { applied: null, error: options.discountCode ? "We couldn't check that code right now. Please try again." : undefined };
  });

  const quote: CheckoutQuote = {
    ...buildQuote(lines, shippingRate, taxRates, applied),
    discountError: error,
    itemPrices: lines.map((line) => ({ itemId: line.itemId, unitPriceCents: line.unitPriceCents })),
  };
  return { quote, lines, shippingRate, taxRates, discount: applied };
};
