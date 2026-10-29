// A discount code that arrived in a link (jlcomfort.com/fabrics?code=JLU25, e.g. from jlupholstery.com)
// and is waiting to be applied at checkout. Kept in this browser only; checkout pre-fills it, the
// server still validates it, and it's cleared once an order is placed or the shopper removes it.

const STORAGE_KEY = 'jl_pending_code_v1';
const MAX_AGE_DAYS = 30;
const CODE_PATTERN = /^[A-Z0-9_-]{2,40}$/;

export const PENDING_CODE_EVENT = 'jl:pending-code';

export function readPendingCode(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw);
    if (typeof code !== 'string' || Date.now() - Number(at) > MAX_AGE_DAYS * 86_400_000) return null;
    return code;
  } catch {
    return null;
  }
}

export function clearPendingCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: nothing was saved.
  }
  window.dispatchEvent(new Event(PENDING_CODE_EVENT));
}

/** Saves ?code= (or ?discount=) from the current URL. Returns the saved code, if any. */
export function captureCodeFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('code') || params.get('discount') || '').trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) return null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, at: Date.now() }));
    window.dispatchEvent(new Event(PENDING_CODE_EVENT));
    return code;
  } catch {
    return null;
  }
}
