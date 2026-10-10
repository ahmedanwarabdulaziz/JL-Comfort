// Turns raw order rows into "checkout sessions" for the admin Abandoned checkouts page.
//
// Every press of "Continue to secure payment" creates an order (pending_payment), and Stripe expires
// the unpaid ones. A shopper who retries three times and then pays left three unpaid rows behind,
// but that's one checkout that was recovered -- not three abandoned ones. So, per email address and
// in time order, unpaid attempts are grouped into one session, and the session ends either with a
// paid order (completed / recovered) or, if none follows, stays abandoned.

export interface CheckoutOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: Date;
  email: string;
  name: string;
  phone: string | null;
  city: string;
  region: string;
  totalCents: number;
  marketingOptIn: boolean;
  items: { name: string; sku: string | null; quantity: number; amountCents: number }[];
}

export type SessionOutcome =
  | 'completed' // paid on the first try
  | 'recovered' // one or more unpaid attempts, then paid
  | 'abandoned' // unpaid, and no paid order followed
  | 'in_progress'; // unpaid, but the latest attempt is too recent to call abandoned

export interface CheckoutSession {
  email: string;
  name: string;
  phone: string | null;
  city: string;
  region: string;
  outcome: SessionOutcome;
  attempts: number; // unpaid attempts in this session
  firstAt: Date;
  lastAt: Date; // latest unpaid attempt, or the paid order
  valueCents: number; // latest attempt's total (or the paid total)
  items: CheckoutOrderRow['items']; // latest attempt's cart
  lastOrderNumber: string; // the latest unpaid attempt (or the paid order for 'completed')
  lastOrderId: string;
  paidOrderNumber: string | null;
  paidAt: Date | null;
  optedIn: boolean; // ticked the marketing box on any attempt in this session
}

const UNPAID = new Set(['pending_payment', 'expired']);
// Stripe Checkout keeps a session open for 24h, but nearly everyone who pays does so within the hour.
const IN_PROGRESS_MS = 60 * 60 * 1000;

export function buildCheckoutSessions(rows: CheckoutOrderRow[], now = new Date()): CheckoutSession[] {
  const byEmail = new Map<string, CheckoutOrderRow[]>();
  for (const row of rows) {
    if (row.status === 'cancelled') continue; // a paid order the admin cancelled isn't a checkout question
    const key = row.email.trim().toLowerCase();
    if (!byEmail.has(key)) byEmail.set(key, []);
    byEmail.get(key)!.push(row);
  }

  const sessions: CheckoutSession[] = [];
  byEmail.forEach((orders, email) => {
    orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    let unpaid: CheckoutOrderRow[] = [];
    for (const order of orders) {
      if (UNPAID.has(order.status)) {
        unpaid.push(order);
        continue;
      }
      const latest = unpaid[unpaid.length - 1];
      sessions.push({
        email,
        name: order.name,
        phone: order.phone,
        city: order.city,
        region: order.region,
        outcome: unpaid.length > 0 ? 'recovered' : 'completed',
        attempts: unpaid.length,
        firstAt: (unpaid[0] || order).createdAt,
        lastAt: order.createdAt,
        valueCents: order.totalCents,
        items: order.items,
        lastOrderNumber: (latest || order).orderNumber,
        lastOrderId: (latest || order).id,
        paidOrderNumber: order.orderNumber,
        paidAt: order.createdAt,
        optedIn: [...unpaid, order].some((o) => o.marketingOptIn),
      });
      unpaid = [];
    }
    if (unpaid.length > 0) {
      const latest = unpaid[unpaid.length - 1];
      sessions.push({
        email,
        name: latest.name,
        phone: latest.phone,
        city: latest.city,
        region: latest.region,
        outcome: now.getTime() - latest.createdAt.getTime() < IN_PROGRESS_MS && latest.status === 'pending_payment' ? 'in_progress' : 'abandoned',
        attempts: unpaid.length,
        firstAt: unpaid[0].createdAt,
        lastAt: latest.createdAt,
        valueCents: latest.totalCents,
        items: latest.items,
        lastOrderNumber: latest.orderNumber,
        lastOrderId: latest.id,
        paidOrderNumber: null,
        paidAt: null,
        optedIn: unpaid.some((o) => o.marketingOptIn),
      });
    }
  });

  return sessions.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export interface CheckoutSummary {
  sessions: number; // finished checkout sessions (excludes in progress)
  completed: number;
  recovered: number;
  abandoned: number;
  abandonmentRate: number; // abandoned / sessions
  recoveryRate: number; // recovered / (recovered + abandoned): of the checkouts that hit a snag, how many came back
  abandonedValueCents: number;
  recoveredValueCents: number;
  abandonedOptedIn: number; // abandoned sessions we're allowed to email
  topAbandonedItems: { name: string; sku: string | null; carts: number; valueCents: number }[];
}

export function summarizeCheckoutSessions(sessions: CheckoutSession[]): CheckoutSummary {
  const finished = sessions.filter((s) => s.outcome !== 'in_progress');
  const abandoned = finished.filter((s) => s.outcome === 'abandoned');
  const recovered = finished.filter((s) => s.outcome === 'recovered');
  const completed = finished.filter((s) => s.outcome === 'completed');

  const items = new Map<string, { name: string; sku: string | null; carts: number; valueCents: number }>();
  for (const session of abandoned) {
    for (const item of session.items) {
      const key = item.sku || item.name;
      const entry = items.get(key) || { name: item.name, sku: item.sku, carts: 0, valueCents: 0 };
      entry.carts += 1;
      entry.valueCents += item.amountCents;
      items.set(key, entry);
    }
  }

  const sum = (list: CheckoutSession[]) => list.reduce((total, s) => total + s.valueCents, 0);
  return {
    sessions: finished.length,
    completed: completed.length,
    recovered: recovered.length,
    abandoned: abandoned.length,
    abandonmentRate: finished.length ? abandoned.length / finished.length : 0,
    recoveryRate: recovered.length + abandoned.length ? recovered.length / (recovered.length + abandoned.length) : 0,
    abandonedValueCents: sum(abandoned),
    recoveredValueCents: sum(recovered),
    abandonedOptedIn: abandoned.filter((s) => s.optedIn).length,
    topAbandonedItems: Array.from(items.values())
      .sort((a, b) => b.carts - a.carts || b.valueCents - a.valueCents)
      .slice(0, 10),
  };
}
