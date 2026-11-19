// Where a buyer came from, shown on Admin → Orders and sent to the Anwarz app. Pure functions, safe in
// the browser and on the server.
//
// Two separate questions:
//  1. The path to the order: requested samples first, emailed us first (ticked by hand -- the site
//     can't see the inbox), or ordered straight away.
//  2. The channel of the visit that led to the order: Google Ads, organic search, an AI assistant,
//     social, another site, or typed the address -- from the order's attribution (lib/analytics/attribution.ts).
import type { Order, OrderAttribution, OrderTouch } from '@/lib/types/order';

// --- 1. earlier sample requests ------------------------------------------------------------------

export interface SampleBefore {
  requestNumber: string;
  createdAt: string;
  matchedBy: 'email' | 'name' | 'phone' | 'postal code';
}

/** The fields of a sample request needed to match it to an order (sample_requests columns). */
export interface SampleForMatching {
  request_number: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address_zip: string | null;
  created_at: string;
}

const normEmail = (v: string | null | undefined) => (v || '').trim().toLowerCase();
const normZip = (v: string | null | undefined) => (v || '').replace(/\s+/g, '').toUpperCase();
/** "Isabelle  Bilodeau", "isabelle bilodeau", "Isabèlle Bilodeau" → "isabelle bilodeau". */
export const normName = (v: string | null | undefined) =>
  (v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z؀-ۿ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
/** The last 10 digits, so "+1 (514) 755-7513" and "5147557513" match. */
const normPhone = (v: string | null | undefined) => (v || '').replace(/\D/g, '').slice(-10);

/**
 * The sample requests the same customer made before this order. People often use another email for
 * samples, so a request matches by email, full name (2+ words, ignoring case and accents), phone, or
 * postal code.
 */
export function matchSamplesBefore(order: Pick<Order, 'customerEmail' | 'customerName' | 'customerPhone' | 'shipPostalCode' | 'createdAt'>, samples: SampleForMatching[]): SampleBefore[] {
  const email = normEmail(order.customerEmail);
  const name = normName(order.customerName);
  const phone = normPhone(order.customerPhone);
  const zip = normZip(order.shipPostalCode);
  const found: SampleBefore[] = [];
  for (const s of samples) {
    if (new Date(s.created_at).getTime() >= order.createdAt.getTime()) continue;
    const matchedBy: SampleBefore['matchedBy'] | null =
      email && normEmail(s.email) === email
        ? 'email'
        : name.includes(' ') && normName(s.name) === name
          ? 'name'
          : phone.length >= 7 && normPhone(s.phone) === phone
            ? 'phone'
            : zip && normZip(s.address_zip) === zip
              ? 'postal code'
              : null;
    if (matchedBy) found.push({ requestNumber: s.request_number, createdAt: s.created_at, matchedBy });
  }
  return found;
}

export type CustomerPath = 'samples' | 'email_enquiry' | 'direct';

export const CUSTOMER_PATH_LABELS: Record<CustomerPath, string> = {
  samples: 'Samples first',
  email_enquiry: 'Email enquiry',
  direct: 'Direct order',
};

/** Samples win over an email enquiry: they are the stronger, system-verified signal. */
export const customerPath = (samplesBefore: SampleBefore[], emailEnquiry: boolean): CustomerPath =>
  samplesBefore.length ? 'samples' : emailEnquiry ? 'email_enquiry' : 'direct';

// --- 2. visit channel ---------------------------------------------------------------------------

export type Channel = 'google_ads' | 'paid_social' | 'other_ads' | 'google_free_listing' | 'organic_search' |'ai' | 'social' | 'email' | 'referral' | 'direct' | 'unknown';

export const CHANNEL_LABELS: Record<Channel, string> = {
  google_ads: 'Google Ads',
  paid_social: 'Facebook/Instagram ads',
  other_ads: 'Other ads',
  google_free_listing: 'Google Shopping (free)',
  organic_search: 'Organic search',
  ai: 'AI assistant',
  social: 'Social media',
  email: 'Email link',
  referral: 'Another website',
  direct: 'Direct / typed',
  unknown: 'Not recorded',
};

// ChatGPT adds utm_source=chatgpt.com to its links; the others show up as the referring site.
const AI_SITES = ['chatgpt', 'openai', 'perplexity', 'gemini.google', 'bard.google', 'copilot', 'claude.ai', 'anthropic', 'you.com', 'phind', 'meta.ai', 'deepseek', 'grok', 'mistral'];
const SEARCH = ['google', 'bing', 'duckduckgo', 'yahoo', 'ecosia', 'baidu', 'yandex', 'brave'];
const SOCIAL = ['facebook', 'instagram', 'pinterest', 'tiktok', 'linkedin', 't.co', 'twitter', 'x.com', 'youtube', 'reddit'];

/**
 * The touch that gets the credit: the visit where the customer first found us. Before Nov 19 2026 the
 * site re-read the referrer on every page, so an ad visitor who opened a second page had their "last
 * touch" overwritten as "google / organic"; the first touch was always right. A later visit only gets
 * the credit when the first one is missing.
 */
export const creditedTouch = (attribution: OrderAttribution | null | undefined): OrderTouch | undefined =>
  attribution?.firstTouch?.source ? attribution.firstTouch : attribution?.lastTouch;

/** The later visit that led to the order, when it was a different channel (e.g. found via an ad, came back by search). */
export function returnTouch(attribution: OrderAttribution | null | undefined): OrderTouch | undefined {
  const first = attribution?.firstTouch;
  const last = attribution?.lastTouch;
  if (!first?.source || !last?.source || channelOf(first) === channelOf(last)) return undefined;
  // The old bug's footprint: a "visit" minutes after landing, from the same site (source "google" vs
  // referrer "google.com"), with the click id gone -- that was the same visit, not a return.
  const site = (t: OrderTouch) => (t.source || '').toLowerCase().replace(/\.(com|ca)$/, '').replace(/^www\./, '');
  if (site(first) === site(last) && first.at && last.at && new Date(last.at).getTime() - new Date(first.at).getTime() < 30 * 60_000) return undefined;
  return last;
}

export function channelOf(touch: OrderTouch | undefined): Channel {
  if (!touch || !touch.source) return 'unknown';
  const source = touch.source.toLowerCase();
  const medium = (touch.medium || '').toLowerCase();
  const referrer = (touch.referrer || '').toLowerCase();
  const landing = (touch.landingPage || '').toLowerCase();
  const has = (list: string[]) => list.some((s) => source.includes(s) || referrer.includes(s));

  if (has(AI_SITES)) return 'ai';
  if (touch.gclid || touch.gbraid || touch.wbraid || /[?&](gclid|gbraid|wbraid|gad_source)=/.test(landing) || (source.includes('google') && /cpc|ppc|paid/.test(medium))) return 'google_ads';
  if (touch.fbclid || medium === 'paid_social') return 'paid_social';
  if (touch.msclkid || /cpc|ppc|paid|display/.test(medium)) return 'other_ads';
  if (medium === 'email' || source.includes('mail')) return 'email';
  // Merchant Center tags its unpaid product listings with srsltid.
  if (medium === 'free_listing' || (source.includes('google') && /[?&]srsltid=/.test(landing))) return 'google_free_listing';
  if (medium === 'organic' || (has(SEARCH) && !medium)) return 'organic_search';
  if (medium === 'social' || has(SOCIAL)) return 'social';
  if (source === 'direct') return 'direct';
  return 'referral';
}

export const CHANNEL_COLORS: Record<Channel, string> = {
  google_ads: '#1a73e8',
  paid_social: '#1877f2',
  other_ads: '#5c6bc0',
  google_free_listing: '#f9a825',
  organic_search: '#188038',
  ai: '#8e24aa',
  social: '#e91e63',
  email: '#00897b',
  referral: '#6d4c41',
  direct: '#546e7a',
  unknown: '#9e9e9e',
};
