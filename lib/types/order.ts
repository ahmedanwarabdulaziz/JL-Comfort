export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'sent_to_supplier'
  | 'shipped'
  | 'delivered'
  | 'closed'
  | 'expired'
  | 'cancelled'
  | 'problem';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  sent_to_supplier: 'Sent to supplier',
  shipped: 'Shipped',
  delivered: 'Delivered',
  closed: 'Closed',
  expired: 'Checkout abandoned',
  cancelled: 'Cancelled',
  problem: 'Problem',
};

export interface OrderItem {
  id: string;
  itemType: 'fabric' | 'vinyl' | 'foam' | 'benchCushion';
  fulfilledBy: 'supplier' | 'workshop';
  fabricId: string | null;
  sku: string | null;
  name: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
}

export interface OrderEvent {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  taxes: { label: string; amountCents: number }[];
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipRegion: string;
  shipPostalCode: string;
  shipCountry: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  supplierOrderNumber: string | null; // e.g. Charlotte's "Order #871459"
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  paidAt: Date | null;
  supplierEmailedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  items: OrderItem[];
  events: OrderEvent[];
}

export interface EmailSettings {
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  internalEmail: string | null;
  supplierName: string;
  supplierEmail: string | null;
  supplierAccountNumber: string | null;
  supplierNotes: string | null;
}

const date = (value: any): Date | null => (value ? new Date(value) : null);

export const rowToOrder = (row: any): Order => ({
  id: row.id,
  orderNumber: row.order_number,
  status: row.status,
  currency: row.currency,
  subtotalCents: row.subtotal_cents,
  shippingCents: row.shipping_cents,
  taxCents: row.tax_cents,
  totalCents: row.total_cents,
  taxes: row.taxes || [],
  customerEmail: row.customer_email,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  shipLine1: row.ship_line1,
  shipLine2: row.ship_line2,
  shipCity: row.ship_city,
  shipRegion: row.ship_region,
  shipPostalCode: row.ship_postal_code,
  shipCountry: row.ship_country,
  stripeCheckoutSessionId: row.stripe_checkout_session_id,
  stripePaymentIntentId: row.stripe_payment_intent_id,
  supplierOrderNumber: row.supplier_order_number ?? null,
  carrier: row.carrier,
  trackingNumber: row.tracking_number,
  trackingUrl: row.tracking_url,
  paidAt: date(row.paid_at),
  supplierEmailedAt: date(row.supplier_emailed_at),
  shippedAt: date(row.shipped_at),
  deliveredAt: date(row.delivered_at),
  closedAt: date(row.closed_at),
  createdAt: new Date(row.created_at),
  items: (row.order_items || [])
    .slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item: any) => ({
      id: item.id,
      itemType: item.item_type,
      fulfilledBy: item.fulfilled_by,
      fabricId: item.fabric_id,
      sku: item.sku,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      amountCents: item.amount_cents,
    })),
  events: (row.order_events || [])
    .slice()
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((event: any) => ({ id: event.id, type: event.type, message: event.message, createdAt: new Date(event.created_at) })),
});

export const rowToEmailSettings = (row: any): EmailSettings => ({
  fromName: row?.from_name || 'JL Comfort',
  fromEmail: row?.from_email || 'orders@jlcomfort.com',
  replyTo: row?.reply_to || null,
  internalEmail: row?.internal_email || null,
  supplierName: row?.supplier_name || 'Charlotte Fabrics',
  supplierEmail: row?.supplier_email || null,
  supplierAccountNumber: row?.supplier_account_number || null,
  supplierNotes: row?.supplier_notes || null,
});

// Domains verified in Resend. The from address must be on one of these or sends are rejected.
export const VERIFIED_SENDING_DOMAINS = ['jlcomfort.com'];

export const CARRIERS: { id: string; name: string; trackingUrl: (n: string) => string }[] = [
  { id: 'ups', name: 'UPS', trackingUrl: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}` },
  { id: 'fedex', name: 'FedEx', trackingUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}` },
  { id: 'canadapost', name: 'Canada Post', trackingUrl: (n) => `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(n)}` },
  { id: 'purolator', name: 'Purolator', trackingUrl: (n) => `https://www.purolator.com/en/shipping/tracker?pin=${encodeURIComponent(n)}` },
  { id: 'usps', name: 'USPS', trackingUrl: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}` },
  { id: 'dhl', name: 'DHL', trackingUrl: (n) => `https://www.dhl.com/ca-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}` },
];
