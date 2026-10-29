import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Public: counts one arrival from a tagged link (utm_source=...) for Admin -> Referrals. Sent by
// lib/analytics/attribution.ts with navigator.sendBeacon. Stores only the link's tags, the landing
// page and a "first arrival from this source in this browser" flag -- nothing that identifies the
// visitor -- so it's counted whatever the cookie choice. Never fails loudly: it's a counter.

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor/i;
const clean = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim() ? value.trim().toLowerCase().slice(0, max) : null;

export async function POST(request: NextRequest) {
  if (BOT_PATTERN.test(request.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const source = clean(body.source, 100);
  if (!source || !supabaseAdmin) return new NextResponse(null, { status: 204 });

  const { error } = await supabaseAdmin.from('referral_visits').insert({
    source,
    medium: clean(body.medium, 100),
    campaign: clean(body.campaign, 100),
    content: clean(body.content, 150),
    term: clean(body.term, 150),
    landing_page: typeof body.landingPage === 'string' ? body.landingPage.slice(0, 300) : null,
    first_visit: body.firstVisit === true,
  });
  if (error) console.error('Could not record referral visit (is migration 20261030120000 applied?):', error.message);
  return new NextResponse(null, { status: 204 });
}
