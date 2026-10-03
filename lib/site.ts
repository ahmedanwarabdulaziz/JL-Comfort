// The public address of the live site. Used for canonical URLs, the sitemap, social previews and
// structured data, so it must be the real production domain (set SITE_URL in the host's env).
export const SITE_URL = (process.env.SITE_URL || 'https://jlcomfort.com').replace(/\/+$/, '');

export const SITE_NAME = 'JL Comfort';

export const SITE_DESCRIPTION =
  'Upholstery fabric by the yard, custom-cut foam and made-to-order bench cushions. Free fabric samples, prices in CAD, shipped across Canada.';

// The business's legal and contact details, shown in the footer, the Privacy Policy and the Terms
// of Service. Anything still in [brackets] is a placeholder that must be replaced before launch.
export const BUSINESS = {
  legalName: '[Legal business name]', // e.g. "JL Comfort Inc." -- as registered
  email: 'sales@jlcomfort.com', // general customer service
  privacyEmail: 'sales@jlcomfort.com', // reaches the Privacy Officer
  phone: '[Phone Number]',
  address: '[Business Address]', // full mailing address, including postal code
  province: '[Province]', // where the business is based; its laws govern the Terms, e.g. "Ontario"
  privacyOfficer: '[Name of Privacy Officer]', // the person responsible for personal information
};

export const BUSINESS_DETAILS_PENDING = Object.values(BUSINESS).some((value) => value.startsWith('['));

// Shown as "Last updated" on the legal pages. Change it whenever their wording changes.
export const LEGAL_LAST_UPDATED = 'September 29, 2026';
