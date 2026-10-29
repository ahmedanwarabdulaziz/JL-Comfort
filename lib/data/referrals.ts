import { supabase } from '@/lib/supabase/client';

// Admin -> Referrals: what each tagged link brought in. Reads through the signed-in admin's session
// (RLS: admin_users only). A row is one source / campaign / content combination -- for the
// jlupholstery.com promos that's jlupholstery / <placement> / <page> (see JLUPHOLSTERY_PROMO_BRIEF.md).
//
// Arrivals come from referral_visits; sample requests and paid orders are matched on the last
// marketing touch they carry (lib/analytics/attribution.ts), falling back to the first.

export interface ReferralRow {
  source: string;
  campaign: string;
  content: string;
  arrivals: number;
  uniqueVisitors: number;
  sampleRequests: number;
  orders: number;
  revenueCents: number;
}

const NONE = '—';
const norm = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : NONE);

function touchOf(attribution: any): { source: string; campaign: string; content: string } | null {
  const touch = attribution?.lastTouch?.source ? attribution.lastTouch : attribution?.firstTouch;
  if (!touch?.source) return null;
  return { source: norm(touch.source), campaign: norm(touch.campaign), content: norm(touch.content) };
}

export async function getReferralReport(since: Date): Promise<ReferralRow[]> {
  if (!supabase) return [];
  const sinceIso = since.toISOString();
  const [visits, samples, orders] = await Promise.all([
    supabase.from('referral_visits').select('source, campaign, content, first_visit').gte('created_at', sinceIso).limit(50000),
    supabase.from('sample_requests').select('attribution').gte('created_at', sinceIso).not('attribution', 'is', null).limit(5000),
    supabase
      .from('orders')
      .select('attribution, total_cents')
      .eq('is_test', false)
      .not('paid_at', 'is', null)
      .gte('paid_at', sinceIso)
      .limit(5000),
  ]);
  for (const result of [visits, samples, orders]) if (result.error) throw result.error;

  const rows = new Map<string, ReferralRow>();
  const rowFor = (source: string, campaign: string, content: string) => {
    const key = `${source}\u0000${campaign}\u0000${content}`;
    let row = rows.get(key);
    if (!row) {
      row = { source, campaign, content, arrivals: 0, uniqueVisitors: 0, sampleRequests: 0, orders: 0, revenueCents: 0 };
      rows.set(key, row);
    }
    return row;
  };

  for (const visit of visits.data || []) {
    const row = rowFor(norm(visit.source), norm(visit.campaign), norm(visit.content));
    row.arrivals += 1;
    if (visit.first_visit) row.uniqueVisitors += 1;
  }
  for (const sample of samples.data || []) {
    const touch = touchOf(sample.attribution);
    if (touch) rowFor(touch.source, touch.campaign, touch.content).sampleRequests += 1;
  }
  for (const order of orders.data || []) {
    const touch = touchOf(order.attribution);
    if (!touch) continue;
    const row = rowFor(touch.source, touch.campaign, touch.content);
    row.orders += 1;
    row.revenueCents += Number(order.total_cents || 0);
  }

  return [...rows.values()].sort((a, b) => b.revenueCents - a.revenueCents || b.arrivals - a.arrivals);
}
