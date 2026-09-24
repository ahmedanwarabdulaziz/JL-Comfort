export interface ShippingRate {
  country: string; // ISO 3166-1 alpha-2, e.g. "CA"
  enabled: boolean;
  fabricOrderFee: number; // once per order when the cart has any fabric/vinyl
  fabricPerYard: number;
  vinylPerYard: number;
  foamPerItem: number;
  benchCushionPerItem: number;
  freeShippingOver: number | null; // subtotal threshold for free shipping; null = never free
  deliveryMinDays: number;
  deliveryMaxDays: number;
  updatedAt?: Date;
}

export type ShippingRateInput = Omit<ShippingRate, 'updatedAt'>;

export interface TaxRate {
  id: string;
  country: string; // ISO 3166-1 alpha-2, e.g. "CA"
  regionCode: string; // ISO 3166-2 subdivision without the country, e.g. "ON"
  regionName: string;
  taxName: string; // e.g. "HST", "GST", "PST"
  rate: number; // percentage, 13 = 13%
  appliesToShipping: boolean;
  enabled: boolean;
  sortOrder: number;
}

export type TaxRateInput = Omit<TaxRate, 'id'>;

/** What the shipping calculator needs to know about one cart line. */
export interface ShippingLine {
  kind: 'fabric' | 'vinyl' | 'foam' | 'benchCushion';
  quantity: number; // yards for fabric/vinyl, units otherwise
  amountCents: number; // line total, used for tax
}

export interface TaxLine {
  id: string;
  label: string; // e.g. "HST (13%)"
  taxName: string;
  rate: number;
  amountCents: number;
}

export interface CheckoutQuote {
  subtotalCents: number;
  shippingCents: number;
  taxes: TaxLine[];
  taxCents: number;
  totalCents: number;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  // Server-verified unit price per cart item; the shipping page syncs the cart to these.
  itemPrices?: { itemId: string; unitPriceCents: number }[];
}
