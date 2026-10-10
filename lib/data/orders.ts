import { supabase } from '@/lib/supabase/client';
import { EmailSettings, Order, OrderStatus, rowToEmailSettings, rowToOrder } from '@/lib/types/order';
import { CheckoutOrderRow } from '@/lib/analytics/abandonedCheckouts';

// Admin-side reads/writes through the signed-in admin's session (RLS: admin_users only).
// Anything that sends email goes through /api/admin/orders/[id] instead.

export const getOrders = async (statuses?: OrderStatus[]): Promise<Order[]> => {
  if (!supabase) return [];
  let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(500);
  if (statuses && statuses.length > 0) query = query.in('status', statuses);
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
  return (data || []).map(rowToOrder);
};

export const getOrderWithHistory = async (id: string): Promise<Order | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('orders').select('*, order_items(*), order_events(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToOrder(data) : null;
};

export const runOrderAction = async (id: string, body: Record<string, unknown>): Promise<{ ok: boolean; order: Order }> => {
  const response = await fetch(`/api/admin/orders/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Action failed');
  return { ok: data.ok, order: rowFromApi(data.order) };
};

// The API returns an already-mapped Order serialized as JSON; revive its dates.
const rowFromApi = (order: any): Order => ({
  ...order,
  paidAt: order.paidAt ? new Date(order.paidAt) : null,
  supplierEmailedAt: order.supplierEmailedAt ? new Date(order.supplierEmailedAt) : null,
  shippedAt: order.shippedAt ? new Date(order.shippedAt) : null,
  deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
  closedAt: order.closedAt ? new Date(order.closedAt) : null,
  createdAt: new Date(order.createdAt),
  events: (order.events || []).map((e: any) => ({ ...e, createdAt: new Date(e.createdAt) })),
});

export const getEmailSettings = async (): Promise<EmailSettings | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('email_settings').select('*').eq('id', true).maybeSingle();
  if (error) throw error;
  return data ? rowToEmailSettings(data) : null;
};

export const saveEmailSettings = async (settings: EmailSettings): Promise<EmailSettings> => {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('email_settings')
    .upsert({
      id: true,
      from_name: settings.fromName,
      from_email: settings.fromEmail,
      reply_to: settings.replyTo,
      internal_email: settings.internalEmail,
      supplier_name: settings.supplierName,
      supplier_email: settings.supplierEmail,
      supplier_sample_email: settings.supplierSampleEmail,
      supplier_copy_email: settings.supplierCopyEmail,
      supplier_account_number: settings.supplierAccountNumber,
      supplier_notes: settings.supplierNotes,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToEmailSettings(data);
};

// ---- Abandoned checkouts page ----

/** Every real (non-test) order since `since`, paid or not, slimmed down for checkout analysis. */
export const getCheckoutOrderRows = async (since: Date): Promise<CheckoutOrderRow[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, created_at, customer_email, customer_name, customer_phone, ship_city, ship_region, total_cents, marketing_opt_in, order_items(name, sku, quantity, amount_cents, sort_order)')
    .eq('is_test', false)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(3000);
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    createdAt: new Date(row.created_at),
    email: row.customer_email || '',
    name: row.customer_name || '',
    phone: row.customer_phone,
    city: row.ship_city || '',
    region: row.ship_region || '',
    totalCents: row.total_cents || 0,
    marketingOptIn: !!row.marketing_opt_in,
    items: (row.order_items || [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((item: any) => ({ name: item.name, sku: item.sku, quantity: Number(item.quantity), amountCents: item.amount_cents })),
  }));
};

/** Current marketing-email status per address ('subscribed' / 'unsubscribed'); absent = never opted in. */
export const getSubscriberStatuses = async (emails: string[]): Promise<Map<string, string>> => {
  const statuses = new Map<string, string>();
  if (!supabase || emails.length === 0) return statuses;
  for (let i = 0; i < emails.length; i += 200) {
    const { data, error } = await supabase.from('email_subscribers').select('email, status').in('email', emails.slice(i, i + 200));
    if (error) throw error;
    (data || []).forEach((row: any) => statuses.set(row.email, row.status));
  }
  return statuses;
};
