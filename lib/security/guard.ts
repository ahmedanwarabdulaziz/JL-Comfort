import { NextResponse } from 'next/server';

// Cheap first line of defence for the public form endpoints (sample requests, checkout): the request
// must come from this site's own pages, and one address can only send so many in a window. Scripts
// can fake an Origin header, so this stops casual abuse and floods, not a determined attacker --
// the real limits (samples per customer, Stripe) still apply behind it.

const ALLOWED_HOSTS = ['jlcomfort.com', 'www.jlcomfort.com', 'localhost', '127.0.0.1'];

function hostOf(value: string | null) {
  if (!value) return '';
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}

/** True when the browser says the request came from one of our pages (or a Vercel preview of this project). */
export function isSameSite(request: Request) {
  const host = hostOf(request.headers.get('origin')) || hostOf(request.headers.get('referer'));
  return ALLOWED_HOSTS.includes(host) || /^jl-comfort[a-z0-9-]*\.vercel\.app$/.test(host);
}

export function clientIp(request: Request) {
  return (request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim();
}

// Per server instance, so it is approximate across Vercel's instances -- enough to blunt a flood.
const hits = new Map<string, number[]>();

export function rateLimited(bucket: string, request: Request, max: number, windowMs: number) {
  const key = `${bucket}:${clientIp(request)}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (!times.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return recent.length > max;
}

/** Returns a response to send back when the request should be refused, else null. */
export function guardPublicForm(request: Request, bucket: string, max: number, windowMs: number): NextResponse | null {
  if (!isSameSite(request)) return NextResponse.json({ error: 'Please use the form on jlcomfort.com.' }, { status: 403 });
  if (rateLimited(bucket, request, max, windowMs)) {
    return NextResponse.json({ error: 'Too many requests from this connection. Please wait a few minutes and try again.' }, { status: 429 });
  }
  return null;
}
