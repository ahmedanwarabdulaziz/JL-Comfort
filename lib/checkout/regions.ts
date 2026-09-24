// Destination regions offered at checkout, keyed by country. Codes are ISO 3166-2 subdivisions
// (without the country prefix) and must match tax_rates.region_code.
export const CHECKOUT_REGIONS: Record<string, ReadonlyArray<readonly [code: string, name: string]>> = {
  CA: [
    ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'],
    ['NB', 'New Brunswick'], ['NL', 'Newfoundland and Labrador'], ['NS', 'Nova Scotia'],
    ['NT', 'Northwest Territories'], ['NU', 'Nunavut'], ['ON', 'Ontario'],
    ['PE', 'Prince Edward Island'], ['QC', 'Quebec'], ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
  ],
};

export const isCheckoutRegion = (country: string, region: string): boolean =>
  (CHECKOUT_REGIONS[country] || []).some(([code]) => code === region);
