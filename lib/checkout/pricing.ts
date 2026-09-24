import { CheckoutQuote, ShippingLine, ShippingRate, TaxLine, TaxRate } from '@/lib/types/checkout';

// Pure shipping + tax math, shared by the admin preview, /api/checkout/quote and /api/checkout so
// the number a customer is quoted is the number Stripe charges. All money is integer cents.

export const toCents = (dollars: number): number => Math.round(dollars * 100);

export const formatTaxRate = (rate: number): string => `${Number(rate.toFixed(3))}%`;

export const computeShippingCents = (lines: ShippingLine[], rate: ShippingRate): number => {
  const subtotalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  if (rate.freeShippingOver !== null && subtotalCents >= toCents(rate.freeShippingOver)) return 0;

  let cents = 0;
  const hasFabric = lines.some((line) => line.kind === 'fabric' || line.kind === 'vinyl');
  if (hasFabric) cents += toCents(rate.fabricOrderFee);

  for (const line of lines) {
    const perUnit =
      line.kind === 'fabric'
        ? rate.fabricPerYard
        : line.kind === 'vinyl'
        ? rate.vinylPerYard
        : line.kind === 'foam'
        ? rate.foamPerItem
        : rate.benchCushionPerItem;
    cents += toCents(perUnit) * line.quantity;
  }
  return cents;
};

// Tax is computed per line and per component, then summed -- the same way Stripe applies
// exclusive tax rates to each Checkout line item -- so rounding matches the charged amount.
export const computeTaxes = (
  lines: ShippingLine[],
  shippingCents: number,
  taxRates: TaxRate[]
): TaxLine[] =>
  taxRates
    .filter((tax) => tax.enabled && tax.rate > 0)
    .map((tax) => {
      const taxable = lines.map((line) => line.amountCents);
      if (tax.appliesToShipping && shippingCents > 0) taxable.push(shippingCents);
      const amountCents = taxable.reduce((sum, amount) => sum + Math.round((amount * tax.rate) / 100), 0);
      return {
        id: tax.id,
        label: `${tax.taxName} (${formatTaxRate(tax.rate)})`,
        taxName: tax.taxName,
        rate: tax.rate,
        amountCents,
      };
    });

export const buildQuote = (lines: ShippingLine[], rate: ShippingRate, taxRates: TaxRate[]): CheckoutQuote => {
  const subtotalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const shippingCents = computeShippingCents(lines, rate);
  const taxes = computeTaxes(lines, shippingCents, taxRates);
  const taxCents = taxes.reduce((sum, tax) => sum + tax.amountCents, 0);
  return {
    subtotalCents,
    shippingCents,
    taxes,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
    deliveryMinDays: rate.deliveryMinDays,
    deliveryMaxDays: rate.deliveryMaxDays,
  };
};
