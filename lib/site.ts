// The public address of the live site. Used for canonical URLs, the sitemap, social previews and
// structured data, so it must be the real production domain (set SITE_URL in the host's env).
export const SITE_URL = (process.env.SITE_URL || 'https://jlcomfort.com').replace(/\/+$/, '');

export const SITE_NAME = 'JL Comfort';

// Whether shoppers and search engines see the supplier's brand: "Charlotte" in fabric titles, the
// Product schema and feed brand, and the /fabrics/charlotte-fabrics page. Off until the dealer
// agreement confirms the name may be used; set NEXT_PUBLIC_SHOW_CHARLOTTE_BRAND=true and redeploy.
export const CHARLOTTE_BRAND_ENABLED = process.env.NEXT_PUBLIC_SHOW_CHARLOTTE_BRAND === 'true';
export const CHARLOTTE_BRAND = 'Charlotte Fabrics';

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

// The mailing address split into parts for structured data (Google reads these, not the one-line
// address above). Leave a part as '' until it's known; empty parts are left out of the markup.
export const BUSINESS_POSTAL_ADDRESS = {
  streetAddress: '',
  addressLocality: '', // city
  addressRegion: '', // province code, e.g. "ON"
  postalCode: '',
};

// Public profiles (Instagram, Facebook, Pinterest, Google Business Profile...), full URLs. They tell
// Google these accounts belong to the business, which helps it build a knowledge panel.
export const SOCIAL_PROFILES: string[] = [];

// A detail is usable only once its [placeholder] has been replaced.
export const businessDetail = (value: string) => (value && !value.startsWith('[') ? value : undefined);

// Shown as "Last updated" on the legal pages. Change it whenever their wording changes.
export const LEGAL_LAST_UPDATED = 'September 29, 2026';
