import { supabase } from '@/lib/supabase/client';
import { EmailSettings, Order, OrderStatus, rowToEmailSettings, rowToOrder } from '@/lib/types/order';

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
      supplier_account_number: settings.supplierAccountNumber,
      supplier_notes: settings.supplierNotes,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToEmailSettings(data);
};
