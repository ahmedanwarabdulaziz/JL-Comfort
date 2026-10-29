// The visitor's cookie choices. Strictly necessary storage (cart, sample list, this choice itself)
// needs no consent. Until the visitor chooses, the default depends on where they are:
//  - Quebec, and anywhere we can't tell: everything optional stays off, since Law 25 requires
//    tracking that can profile someone to be off by default.
//  - Elsewhere: analytics and advertising are on by default, with a clear one-click opt-out in the
//    banner (opt-out consent under PIPEDA and the federal guidance on online behavioural ads).
// middleware.ts sets REGION_COOKIE from the visitor's location, so the default is known on the
// very first page view.

export interface ConsentChoices {
  analytics: boolean;
  advertising: boolean;
}

// Also read by the inline tag snippets in components/analytics/AdTracking.tsx -- keep them in sync.
export const CONSENT_STORAGE_KEY = 'jl_consent_v1';
export const REGION_COOKIE = 'jl_consent_region';
export const CONSENT_CHANGE_EVENT = 'jl:consent-change';
export const CONSENT_OPEN_EVENT = 'jl:consent-open';

// 'open': analytics and advertising on by default. 'strict': everything optional off until the visitor opts in.
export type ConsentRegion = 'open' | 'strict';

export function readConsentRegion(): ConsentRegion {
  try {
    return new RegExp(`(?:^|;\\s*)${REGION_COOKIE}=open(?:;|$)`).test(document.cookie) ? 'open' : 'strict';
  } catch {
    return 'strict';
  }
}

export function defaultConsent(): ConsentChoices {
  const open = readConsentRegion() === 'open';
  return { analytics: open, advertising: open };
}

// The choice the visitor saved, or null if they haven't chosen yet.
export function readConsent(): ConsentChoices | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { analytics: parsed.analytics === true, advertising: parsed.advertising === true };
  } catch {
    return null;
  }
}

// What applies right now: the saved choice, or the regional default until there is one.
export function effectiveConsent(): ConsentChoices {
  return readConsent() || defaultConsent();
}

export function saveConsent(choices: ConsentChoices) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...choices, updatedAt: new Date().toISOString() }));
  } catch {
    // Storage blocked: the choice still applies for this page view through the event below.
  }
  window.dispatchEvent(new CustomEvent<ConsentChoices>(CONSENT_CHANGE_EVENT, { detail: choices }));
}

// Reopens the cookie preferences (the footer's "Cookie settings" link).
export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

export function onConsentChange(listener: (choices: ConsentChoices) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<ConsentChoices>).detail);
  window.addEventListener(CONSENT_CHANGE_EVENT, handler);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handler);
}
