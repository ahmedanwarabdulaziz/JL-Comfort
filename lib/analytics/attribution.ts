// Where a shopper came from, saved on each order so the admin panel can show which ad, campaign or
// site produced the sale -- independent of whether the visitor accepted analytics cookies.
//
// Only campaign parameters, the referring site and the landing page are kept: no identifiers, and
// it lives in this browser's storage only until it is attached to an order.
import { readConsent } from '@/lib/consent';

export interface Touch {
  source?: string; // utm_source, or the referring domain, or "direct"
  medium?: string; // utm_medium, or "organic" / "referral" / "none"
  campaign?: string;
  term?: string;
  content?: string;
  gclid?: string; // Google Ads click
  gbraid?: string;
  wbraid?: string;
  fbclid?: string; // Meta (Facebook/Instagram) click
  msclkid?: string; // Microsoft Ads click
  referrer?: string;
  landingPage?: string;
  at: string; // ISO time of the visit
}

export interface Attribution {
  firstTouch: Touch;
  lastTouch: Touch;
}

const STORAGE_KEY = 'jl_attribution_v1';
const MAX_AGE_DAYS = 90;
const CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'] as const;
const SEARCH_ENGINES = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'ecosia.', 'baidu.', 'yandex.'];
// Coming back from paying on Stripe is part of checkout, not a new visit.
const IGNORED_REFERRERS = ['stripe.com'];
const SOCIAL_SITES = ['facebook.', 'instagram.', 'pinterest.', 'tiktok.', 'linkedin.', 't.co', 'twitter.', 'x.com', 'youtube.', 'reddit.'];

const clip = (value: string | null | undefined, max = 200) => (value ? value.slice(0, max) : undefined);

// Classifies the current page view. Returns null for an internal navigation (nothing new to record).
function currentTouch(): Touch | null {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const touch: Touch = { at: new Date().toISOString(), landingPage: clip(url.pathname + url.search, 300) };

  for (const id of CLICK_IDS) {
    const value = params.get(id);
    if (value) touch[id] = clip(value);
  }

  const utmSource = params.get('utm_source');
  let referrerHost = '';
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
  } catch {
    referrerHost = '';
  }
  const internalReferrer = referrerHost && referrerHost === url.hostname.replace(/^www\./, '');
  if (IGNORED_REFERRERS.some((host) => referrerHost.endsWith(host))) return null;

  if (utmSource) {
    touch.source = clip(utmSource);
    touch.medium = clip(params.get('utm_medium'));
    touch.campaign = clip(params.get('utm_campaign'));
    touch.term = clip(params.get('utm_term'));
    touch.content = clip(params.get('utm_content'));
  } else if (touch.gclid || touch.gbraid || touch.wbraid) {
    touch.source = 'google';
    touch.medium = 'cpc';
  } else if (touch.fbclid) {
    touch.source = referrerHost.includes('instagram') ? 'instagram' : 'facebook';
    touch.medium = 'paid_social';
  } else if (touch.msclkid) {
    touch.source = 'bing';
    touch.medium = 'cpc';
  } else if (referrerHost && !internalReferrer) {
    touch.source = referrerHost;
    touch.medium = SEARCH_ENGINES.some((engine) => referrerHost.includes(engine))
      ? 'organic'
      : SOCIAL_SITES.some((site) => referrerHost.includes(site))
        ? 'social'
        : 'referral';
  } else if (!referrerHost) {
    touch.source = 'direct';
    touch.medium = 'none';
  } else {
    return null; // moving between pages of this site
  }

  if (referrerHost && !internalReferrer) touch.referrer = clip(document.referrer, 300);
  return touch;
}

export function readAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    const ageDays = (Date.now() - new Date(parsed.firstTouch.at).getTime()) / 86_400_000;
    return ageDays > MAX_AGE_DAYS ? null : parsed;
  } catch {
    return null;
  }
}

// Called on every page view. The first visit is kept as the first touch; the latest visit that
// arrived from outside the site becomes the last touch -- except that a plain "direct" return
// visit never overwrites a real campaign, the usual last-non-direct-click rule.
export function recordVisit() {
  try {
    const touch = currentTouch();
    if (!touch) return;
    const saved = readAttribution();
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ firstTouch: touch, lastTouch: touch }));
      return;
    }
    if (touch.source === 'direct' && saved.lastTouch.source !== 'direct') return;
    // The same arrival seen again (a reload, or React re-running the effect) is not a new visit.
    const sameArrival =
      touch.source === saved.lastTouch.source &&
      touch.landingPage === saved.lastTouch.landingPage &&
      Date.now() - new Date(saved.lastTouch.at).getTime() < 30 * 60_000;
    if (sameArrival) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, lastTouch: touch }));
  } catch {
    // Storage blocked: the order simply won't carry a source.
  }
}

const readCookie = (name: string) =>
  document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.slice(name.length + 1);

// The identifiers the server needs to report the purchase to GA4 and Meta itself (so a sale still
// counts when an ad blocker stops the browser tags). Only included for the kinds of tracking the
// shopper agreed to.
export interface AdSignals {
  consent: { analytics: boolean; advertising: boolean };
  gaClientId?: string;
  gaSessionId?: string;
  fbp?: string;
  fbc?: string;
}

export function collectAdSignals(): AdSignals {
  const consent = readConsent() || { analytics: false, advertising: false };
  const signals: AdSignals = { consent };
  try {
    if (consent.analytics) {
      // _ga = GA1.1.<client id>; _ga_<ID> holds the session id ("GS1.1.<id>.…" or "GS2.1.s<id>$…").
      const ga = readCookie('_ga');
      if (ga) signals.gaClientId = ga.split('.').slice(2).join('.');
      const measurementId = (process.env.NEXT_PUBLIC_GA4_ID || '').replace(/^G-/, '');
      const gaSession = measurementId ? readCookie(`_ga_${measurementId}`) : undefined;
      const sessionMatch = gaSession?.match(/^GS1\.\d+\.(\d+)/) || gaSession?.match(/^GS2\.\d+\.s(\d+)/);
      if (sessionMatch) signals.gaSessionId = sessionMatch[1];
    }
    if (consent.advertising) {
      signals.fbp = readCookie('_fbp');
      const fbclid = readAttribution()?.lastTouch.fbclid;
      signals.fbc = readCookie('_fbc') || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);
    }
  } catch {
    // Cookies unreadable: the browser tags still report the purchase.
  }
  return signals;
}
