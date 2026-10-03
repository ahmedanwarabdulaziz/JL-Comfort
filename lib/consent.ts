// The visitor's cookie choices. Analytics and advertising tags stay off until the visitor opts in
// (Quebec's Law 25 requires tracking that can profile someone to be off by default); strictly
// necessary storage (cart, sample list, this choice itself) needs no consent.

export interface ConsentChoices {
  analytics: boolean;
  advertising: boolean;
}

// Also read by the inline tag snippets in components/analytics/AdTracking.tsx -- keep them in sync.
export const CONSENT_STORAGE_KEY = 'jl_consent_v1';
export const CONSENT_CHANGE_EVENT = 'jl:consent-change';
export const CONSENT_OPEN_EVENT = 'jl:consent-open';

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
