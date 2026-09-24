import { supabaseAdmin } from '@/lib/supabase/admin';
import { deliverEmail, getEmailSettings } from '@/lib/email/deliver';
import {
  EmailContent,
  customerConfirmation,
  customerShipped,
  internalNotification,
  supplierItems,
  supplierPurchaseOrder,
} from '@/lib/email/orderEmails';
import { CheckoutError } from '@/lib/checkout/errors';
import { PricedLine } from '@/lib/checkout/serverPricing';
import { CheckoutQuote } from '@/lib/types/checkout';
import {
  CARRIERS,
  EmailSettings,
  Order,
  OrderStatus,
  rowToOrder,
} from '@/lib/types/order';

// Server-only order service. Writes use the service-role client: the checkout route and Stripe
// webhook have no admin session, and /api/admin/* callers are already verified by middleware.ts.

const db = () => {
  if (!supabaseAdmin) throw new CheckoutError('Orders are not configured (SUPABASE_SERVICE_ROLE_KEY missing).', 503);
  return supabaseAdmin;
};

const ORDER_SELECT = '*, order_items(*), order_events(*)';

export interface ShippingAddress {
  email: string;
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export async function createPendingOrder(
  lines: PricedLine[],
  quote: CheckoutQuote,
  address: ShippingAddress
): Promise<{ id: string; orderNumber: string }> {
  const { data: order, error } = await db()
    .from('orders')
    .insert({
      subtotal_cents: quote.subtotalCents,
      shipping_cents: quote.shippingCents,
      tax_cents: quote.taxCents,
      total_cents: quote.totalCents,
      taxes: quote.taxes.map((tax) => ({ label: tax.label, amountCents: tax.amountCents })),
      customer_email: address.email,
      customer_name: address.name,
      customer_phone: address.phone || null,
      ship_line1: address.line1,
      ship_line2: address.line2 || null,
      ship_city: address.city,
      ship_region: address.region,
      ship_postal_code: address.postalCode,
      ship_country: address.country,
    })
    .select('id, order_number')
    .single();
  if (error || !order) {
    console.error('Error creating order:', error);
    throw new CheckoutError('Unable to create your order right now. Please try again.', 503);
  }

  const { error: itemsError } = await db()
    .from('order_items')
    .insert(
      lines.map((line, index) => ({
        order_id: order.id,
        item_type: line.kind,
        // Stage 1: Charlotte drop-ships yardage; foam and cushions are made in the workshop.
        fulfilled_by: line.kind === 'fabric' || line.kind === 'vinyl' ? 'supplier' : 'workshop',
        fabric_id: line.fabricId || null,
        sku: line.sku || null,
        name: line.name,
        description: line.description,
        quantity: line.quantity,
        unit_price_cents: line.unitPriceCents,
        amount_cents: line.amountCents,
        sort_order: index,
      }))
    );
  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    await db().from('orders').update({ status: 'expired' }).eq('id', order.id);
    throw new CheckoutError('Unable to create your order right now. Please try again.', 503);
  }

  return { id: order.id, orderNumber: order.order_number };
}

export async function attachCheckoutSession(orderId: string, sessionId: string) {
  const { error } = await db().from('orders').update({ stripe_checkout_session_id: sessionId }).eq('id', orderId);
  if (error) throw error;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await db().from('orders').select(ORDER_SELECT).eq('id', orderId).maybeSingle();
  if (error) throw error;
  return data ? rowToOrder(data) : null;
}

export async function logOrderEvent(orderId: string, type: string, message: string) {
  const { error } = await db().from('order_events').insert({ order_id: orderId, type, message });
  if (error) console.error('Error logging order event:', error);
}

export async function setOrderStatus(orderId: string, status: OrderStatus, extra: Record<string, unknown> = {}) {
  const { error } = await db()
    .from('orders')
    .update({ status, ...extra })
    .eq('id', orderId);
  if (error) throw error;
}

/**
 * Moves an order from pending_payment to paid. Returns false if it was already processed, which
 * makes the Stripe webhook safe to deliver more than once: only the first delivery sends emails.
 */
export async function markOrderPaid(
  orderId: string,
  payment: { sessionId: string; paymentIntentId: string | null; taxCents: number | null; totalCents: number | null }
): Promise<boolean> {
  const patch: Record<string, unknown> = {
    status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_checkout_session_id: payment.sessionId,
    stripe_payment_intent_id: payment.paymentIntentId,
  };
  // Stripe's figures are what was actually charged; keep them if present.
  if (payment.taxCents !== null) patch.tax_cents = payment.taxCents;
  if (payment.totalCents !== null) patch.total_cents = payment.totalCents;

  const { data, error } = await db()
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .in('status', ['pending_payment', 'expired'])
    .select('id');
  if (error) throw error;
  return (data || []).length > 0;
}

export async function markOrderExpired(orderId: string) {
  await db().from('orders').update({ status: 'expired' }).eq('id', orderId).eq('status', 'pending_payment');
}

// --- email ---------------------------------------------------------------------------------

export { getEmailSettings };

const deliver = (
  order: Order,
  settings: EmailSettings,
  to: string,
  content: EmailContent,
  eventType: string,
  idempotencyKey?: string
) =>
  deliverEmail({
    settings,
    to,
    content,
    eventType,
    idempotencyKey,
    context: `Order ${order.orderNumber}`,
    log: (type, message) => logOrderEvent(order.id, type, message),
  });

/** Sends the supplier PO if the order has supplier-fulfilled items. Returns a one-line status. */
export async function sendSupplierPurchaseOrder(order: Order, settings: EmailSettings, idempotencyKey?: string): Promise<string> {
  if (supplierItems(order).length === 0) return 'No supplier items (made in the workshop)';
  if (!settings.supplierEmail) {
    await logOrderEvent(order.id, 'email_failed', 'Purchase order NOT sent: no supplier email is set in Admin → Email Settings.');
    return 'NOT SENT: no supplier email set in admin';
  }
  const sent = await deliver(order, settings, settings.supplierEmail, supplierPurchaseOrder(order, settings), 'supplier_po', idempotencyKey);
  if (!sent) return `NOT SENT: email to ${settings.supplierEmail} failed (see order history)`;
  if (order.status === 'paid') {
    await setOrderStatus(order.id, 'sent_to_supplier', { supplier_emailed_at: new Date().toISOString() });
  } else {
    await db().from('orders').update({ supplier_emailed_at: new Date().toISOString() }).eq('id', order.id);
  }
  return `Purchase order emailed to ${settings.supplierEmail}`;
}

export async function sendCustomerConfirmation(order: Order, settings: EmailSettings, idempotencyKey?: string) {
  return deliver(order, settings, order.customerEmail, customerConfirmation(order, settings), 'customer_confirmation', idempotencyKey);
}

/** Everything that happens once a payment is confirmed. Never throws: failures are logged on the order. */
export async function sendNewOrderEmails(orderId: string, siteOrigin: string) {
  const order = await getOrder(orderId);
  if (!order) return;
  let settings: EmailSettings;
  try {
    settings = await getEmailSettings();
  } catch (error: any) {
    await logOrderEvent(orderId, 'email_failed', `Could not load email settings: ${error.message || error}`);
    return;
  }

  const supplierStatus = await sendSupplierPurchaseOrder(order, settings, `${order.id}-supplier-po`);
  await sendCustomerConfirmation(order, settings, `${order.id}-confirmation`);
  if (settings.internalEmail) {
    await deliver(
      order,
      settings,
      settings.internalEmail,
      internalNotification(order, `${siteOrigin}/admin/orders?order=${order.id}`, supplierStatus),
      'internal_notification',
      `${order.id}-internal`
    );
  }
}

/** A supplier reference such as "#871459", normalized without the leading "#". */
export const normalizeSupplierRef = (value: unknown) => String(value ?? '').trim().replace(/^#\s*/, '');

const SUPPLIER_REF_FIELDS = {
  orderNumber: { column: 'supplier_order_number', label: 'order ref' },
  invoiceNumber: { column: 'supplier_invoice_number', label: 'invoice' },
} as const;

/** Sets the supplier's order ref # and/or invoice #; only the keys passed are changed. */
export async function setSupplierRefs(orderId: string, refs: { orderNumber?: unknown; invoiceNumber?: unknown }) {
  const patch: Record<string, string | null> = {};
  const notes: string[] = [];
  for (const key of Object.keys(SUPPLIER_REF_FIELDS) as (keyof typeof SUPPLIER_REF_FIELDS)[]) {
    if (refs[key] === undefined) continue;
    const value = normalizeSupplierRef(refs[key]) || null;
    patch[SUPPLIER_REF_FIELDS[key].column] = value;
    notes.push(value ? `supplier ${SUPPLIER_REF_FIELDS[key].label} #${value}` : `supplier ${SUPPLIER_REF_FIELDS[key].label} # cleared`);
  }
  if (notes.length === 0) return;
  const { error } = await db().from('orders').update(patch).eq('id', orderId);
  if (error) throw error;
  await logOrderEvent(orderId, 'supplier_order', `Linked: ${notes.join(', ')}`);
}

export async function markOrderShipped(orderId: string, carrierId: string, trackingNumber: string, customUrl?: string) {
  const order = await getOrder(orderId);
  if (!order) throw new CheckoutError('Order not found', 404);
  const carrier = CARRIERS.find((c) => c.id === carrierId);
  const carrierName = carrier?.name || carrierId;
  const trackingUrl = customUrl || carrier?.trackingUrl(trackingNumber) || null;

  await setOrderStatus(orderId, 'shipped', {
    carrier: carrierName,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    shipped_at: new Date().toISOString(),
  });
  await logOrderEvent(orderId, 'shipped', `Marked shipped with ${carrierName}, tracking ${trackingNumber}`);

  const settings = await getEmailSettings();
  const updated = (await getOrder(orderId))!;
  return deliver(updated, settings, updated.customerEmail, customerShipped(updated, carrierName, settings), 'customer_shipped');
}

export async function resendShippedEmail(order: Order) {
  if (!order.trackingNumber) throw new CheckoutError('This order has no tracking number yet.');
  const settings = await getEmailSettings();
  return deliver(order, settings, order.customerEmail, customerShipped(order, order.carrier || 'Carrier', settings), 'customer_shipped');
}
