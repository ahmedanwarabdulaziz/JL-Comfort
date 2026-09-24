import { getShippingRate } from '@/lib/data/shippingRates';
import { getRegionTaxRates } from '@/lib/data/taxRates';
import { buildQuote } from '@/lib/checkout/pricing';
import { CheckoutError } from '@/lib/checkout/errors';
import { PricedLine, priceCart } from '@/lib/checkout/serverPricing';
import { CheckoutQuote, ShippingRate, TaxRate } from '@/lib/types/checkout';
import type { CartItem } from '@/lib/context/CartContext';

export { CheckoutError };

export interface CartQuote {
  quote: CheckoutQuote;
  lines: PricedLine[];
  shippingRate: ShippingRate;
  taxRates: TaxRate[];
}

export const quoteCart = async (items: CartItem[], country: string, regionCode: string): Promise<CartQuote> => {
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
  const quote: CheckoutQuote = {
    ...buildQuote(lines, shippingRate, taxRates),
    itemPrices: lines.map((line) => ({ itemId: line.itemId, unitPriceCents: line.unitPriceCents })),
  };
  return { quote, lines, shippingRate, taxRates };
};
