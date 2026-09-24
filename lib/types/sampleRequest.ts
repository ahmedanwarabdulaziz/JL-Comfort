export interface SampleRequestItem {
  fabricId: string;
  name: string;
  sku: string;
  imageUrl: string;
}

export type SampleRequestStatus = 'pending' | 'sent_to_supplier' | 'shipped' | 'delivered' | 'cancelled' | 'problem';

export const SAMPLE_STATUS_LABELS: Record<SampleRequestStatus, string> = {
  pending: 'Received',
  sent_to_supplier: 'Sent to supplier',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  problem: 'Problem',
};

export interface SampleRequestAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface SampleRequestEvent {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
}

export interface SampleRequest {
  id: string;
  requestNumber: string; // "S-1001"
  items: SampleRequestItem[];
  name: string;
  email: string;
  phone?: string;
  address: SampleRequestAddress;
  status: SampleRequestStatus;
  supplierOrderNumber: string | null;
  supplierInvoiceNumber: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  supplierEmailedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  events: SampleRequestEvent[];
}

export interface SampleRequestInput {
  items: SampleRequestItem[];
  name: string;
  email: string;
  phone?: string;
  address: SampleRequestAddress;
}

export interface SampleSettings {
  requestsEnabled: boolean;
  maxPerRequest: number;
  maxPerCustomer: number; // samples per customer within periodDays
  periodDays: number;
}

export const DEFAULT_SAMPLE_SETTINGS: SampleSettings = {
  requestsEnabled: true,
  maxPerRequest: 5,
  maxPerCustomer: 10,
  periodDays: 30,
};

export const rowToSampleSettings = (row: any): SampleSettings =>
  row
    ? {
        requestsEnabled: row.requests_enabled ?? true,
        maxPerRequest: row.max_per_request ?? DEFAULT_SAMPLE_SETTINGS.maxPerRequest,
        maxPerCustomer: row.max_per_customer ?? DEFAULT_SAMPLE_SETTINGS.maxPerCustomer,
        periodDays: row.period_days ?? DEFAULT_SAMPLE_SETTINGS.periodDays,
      }
    : DEFAULT_SAMPLE_SETTINGS;

const date = (value: any): Date | null => (value ? new Date(value) : null);

export const rowToSampleRequest = (row: any): SampleRequest => ({
  id: row.id,
  requestNumber: row.request_number || '',
  items: ((row.sample_request_items || []) as any[])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(
      (item): SampleRequestItem => ({
        fabricId: item.fabric_id || '',
        name: item.name || '',
        sku: item.sku || '',
        imageUrl: item.image_url || '',
      })
    ),
  name: row.name || '',
  email: row.email || '',
  phone: row.phone || undefined,
  address: {
    line1: row.address_line1 || '',
    line2: row.address_line2 || undefined,
    city: row.address_city || '',
    state: row.address_state || '',
    zip: row.address_zip || '',
    country: row.address_country || '',
  },
  status: row.status || 'pending',
  supplierOrderNumber: row.supplier_order_number ?? null,
  supplierInvoiceNumber: row.supplier_invoice_number ?? null,
  carrier: row.carrier ?? null,
  trackingNumber: row.tracking_number ?? null,
  trackingUrl: row.tracking_url ?? null,
  supplierEmailedAt: date(row.supplier_emailed_at),
  shippedAt: date(row.shipped_at),
  deliveredAt: date(row.delivered_at),
  createdAt: new Date(row.created_at),
  events: ((row.sample_request_events || []) as any[])
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((e) => ({ id: e.id, type: e.type, message: e.message, createdAt: new Date(e.created_at) })),
});
