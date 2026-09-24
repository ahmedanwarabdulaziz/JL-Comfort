import { supabaseAdmin } from '@/lib/supabase/admin';
import { CheckoutError } from '@/lib/checkout/errors';
import { deliverEmail, getEmailSettings } from '@/lib/email/deliver';
import { EmailContent } from '@/lib/email/layout';
import {
  customerSampleConfirmation,
  customerSamplesShipped,
  internalSampleNotification,
  supplierSampleRequest,
} from '@/lib/email/sampleEmails';
import { CARRIERS, EmailSettings } from '@/lib/types/order';
import {
  SAMPLE_STATUS_LABELS,
  SampleRequest,
  SampleRequestInput,
  SampleRequestStatus,
  SampleSettings,
  rowToSampleRequest,
  rowToSampleSettings,
} from '@/lib/types/sampleRequest';

// Server-only sample request service (service-role client). Mirrors lib/orders/server.ts.

const db = () => {
  if (!supabaseAdmin) throw new CheckoutError('Sample requests are not configured (SUPABASE_SERVICE_ROLE_KEY missing).', 503);
  return supabaseAdmin;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getSampleSettings(): Promise<SampleSettings> {
  const { data, error } = await db().from('sample_settings').select('*').eq('id', true).maybeSingle();
  if (error) throw error;
  return rowToSampleSettings(data);
}

// A "customer" for the limit is the same email OR the same street address + postal code, so a
// second email address to the same house still counts against the same allowance.
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeZip = (value: string) => value.replace(/\s+/g, '').toUpperCase();
const normalizeStreet = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function samplesRequestedRecently(email: string, zip: string, line1: string, periodDays: number): Promise<number> {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db()
    .from('sample_requests')
    .select('email, address_zip, address_line1, status, sample_request_items(id)')
    .gte('created_at', since)
    .neq('status', 'cancelled')
    .limit(5000);
  if (error) throw error;

  const wantEmail = normalizeEmail(email);
  const wantZip = normalizeZip(zip);
  const wantStreet = normalizeStreet(line1);
  return (data || [])
    .filter(
      (row: any) =>
        normalizeEmail(row.email || '') === wantEmail ||
        (normalizeZip(row.address_zip || '') === wantZip && normalizeStreet(row.address_line1 || '') === wantStreet)
    )
    .reduce((sum: number, row: any) => sum + (row.sample_request_items || []).length, 0);
}

/**
 * Validates and stores a storefront sample request. Fabric names/SKUs come from the catalog, not the
 * browser, and the admin's limits are enforced here -- the storefront's cap is only a convenience.
 */
export async function createSampleRequest(input: SampleRequestInput): Promise<string> {
  const settings = await getSampleSettings();
  if (!settings.requestsEnabled) throw new CheckoutError('Sample requests are paused at the moment. Please check back soon.');

  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim();
  const address = input.address || ({} as SampleRequestInput['address']);
  if (!name || !EMAIL_PATTERN.test(email)) throw new CheckoutError('Please enter your name and a valid email address.');
  if (!address.line1?.trim() || !address.city?.trim() || !address.state?.trim() || !address.zip?.trim() || !address.country?.trim()) {
    throw new CheckoutError('A complete shipping address is required.');
  }

  const fabricIds = Array.from(
    new Set((Array.isArray(input.items) ? input.items : []).map((item) => String(item?.fabricId || '')).filter((id) => UUID_PATTERN.test(id)))
  );
  if (fabricIds.length === 0) throw new CheckoutError('At least one fabric sample is required.');
  if (fabricIds.length > settings.maxPerRequest) {
    throw new CheckoutError(`You can request up to ${settings.maxPerRequest} samples at a time.`);
  }

  const alreadyRequested = await samplesRequestedRecently(email, address.zip, address.line1, settings.periodDays);
  const remaining = Math.max(0, settings.maxPerCustomer - alreadyRequested);
  if (fabricIds.length > remaining) {
    throw new CheckoutError(
      remaining === 0
        ? `You've reached the limit of ${settings.maxPerCustomer} free samples every ${settings.periodDays} days. Please contact us if you need more.`
        : `You can request ${remaining} more free sample${remaining === 1 ? '' : 's'} right now (limit ${settings.maxPerCustomer} every ${settings.periodDays} days). Please remove ${fabricIds.length - remaining} from your list.`
    );
  }

  const { data: fabrics, error: fabricsError } = await db()
    .from('charlotte_fabrics')
    .select('id, name, sku, image_url, status')
    .in('id', fabricIds);
  if (fabricsError) throw fabricsError;
  const byId = new Map((fabrics || []).filter((f: any) => f.status === 'active').map((f: any) => [f.id, f]));
  const missing = fabricIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new CheckoutError('One of the fabrics in your sample list is no longer available. Please remove it and try again.');
  }

  const { data: row, error } = await db()
    .from('sample_requests')
    .insert({
      name,
      email,
      phone: input.phone?.trim() || null,
      address_line1: address.line1.trim(),
      address_line2: address.line2?.trim() || null,
      address_city: address.city.trim(),
      address_state: address.state.trim(),
      address_zip: address.zip.trim().toUpperCase(),
      address_country: address.country.trim(),
      status: 'pending',
    })
    .select('id')
    .single();
  if (error || !row) throw error || new Error('Insert returned no row');

  const { error: itemsError } = await db()
    .from('sample_request_items')
    .insert(
      fabricIds.map((id, index) => {
        const fabric: any = byId.get(id);
        return { sample_request_id: row.id, fabric_id: id, name: fabric.name, sku: fabric.sku, image_url: fabric.image_url || '', sort_order: index };
      })
    );
  if (itemsError) {
    await db().from('sample_requests').delete().eq('id', row.id);
    throw itemsError;
  }
  return row.id;
}

export async function getSampleRequest(id: string): Promise<SampleRequest | null> {
  const { data, error } = await db()
    .from('sample_requests')
    .select('*, sample_request_items(*), sample_request_events(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSampleRequest(data) : null;
}

export async function logSampleEvent(id: string, type: string, message: string) {
  const { error } = await db().from('sample_request_events').insert({ sample_request_id: id, type, message });
  if (error) console.error('Error logging sample request event:', error);
}

const deliver = (request: SampleRequest, settings: EmailSettings, to: string, content: EmailContent, eventType: string, idempotencyKey?: string) =>
  deliverEmail({
    settings,
    to,
    content,
    eventType,
    idempotencyKey,
    context: `Sample request ${request.requestNumber}`,
    log: (type, message) => logSampleEvent(request.id, type, message),
  });

export async function sendSupplierSampleRequest(request: SampleRequest, settings: EmailSettings, idempotencyKey?: string): Promise<string> {
  const to = settings.supplierSampleEmail || settings.supplierEmail;
  if (!to) {
    await logSampleEvent(request.id, 'email_failed', 'Sample request NOT sent to the supplier: no supplier email is set in Admin → Email Settings.');
    return 'NOT SENT: no supplier email set in admin';
  }
  const sent = await deliver(request, settings, to, supplierSampleRequest(request, settings), 'supplier_sample_request', idempotencyKey);
  if (!sent) return `NOT SENT: email to ${to} failed (see request history)`;
  const patch: Record<string, unknown> = { supplier_emailed_at: new Date().toISOString() };
  if (request.status === 'pending') patch.status = 'sent_to_supplier';
  await db().from('sample_requests').update(patch).eq('id', request.id);
  return `Sample request emailed to ${to}`;
}

export async function sendCustomerSampleConfirmation(request: SampleRequest, settings: EmailSettings, idempotencyKey?: string) {
  return deliver(request, settings, request.email, customerSampleConfirmation(request, settings), 'customer_confirmation', idempotencyKey);
}

/** Everything that happens after a request is stored. Never throws: failures are logged on the request. */
export async function sendNewSampleRequestEmails(id: string, siteOrigin: string) {
  const request = await getSampleRequest(id);
  if (!request) return;
  let settings: EmailSettings;
  try {
    settings = await getEmailSettings();
  } catch (error: any) {
    await logSampleEvent(id, 'email_failed', `Could not load email settings: ${error.message || error}`);
    return;
  }

  const supplierStatus = await sendSupplierSampleRequest(request, settings, `${id}-supplier-samples`);
  await sendCustomerSampleConfirmation(request, settings, `${id}-sample-confirmation`);
  if (settings.internalEmail) {
    await deliver(
      request,
      settings,
      settings.internalEmail,
      internalSampleNotification(request, `${siteOrigin}/admin/sample-requests?request=${id}`, supplierStatus),
      'internal_notification',
      `${id}-sample-internal`
    );
  }
}

export async function markSamplesShipped(id: string, carrierId: string, trackingNumber: string, customUrl?: string) {
  const carrier = CARRIERS.find((c) => c.id === carrierId);
  const carrierName = carrier?.name || carrierId;
  const { error } = await db()
    .from('sample_requests')
    .update({
      status: 'shipped',
      carrier: carrierName,
      tracking_number: trackingNumber,
      tracking_url: customUrl || carrier?.trackingUrl(trackingNumber) || null,
      shipped_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
  await logSampleEvent(id, 'shipped', `Marked shipped with ${carrierName}, tracking ${trackingNumber}`);
  return resendSamplesShippedEmail((await getSampleRequest(id))!);
}

export async function resendSamplesShippedEmail(request: SampleRequest) {
  if (!request.trackingNumber) throw new CheckoutError('This request has no tracking number yet.');
  const settings = await getEmailSettings();
  return deliver(request, settings, request.email, customerSamplesShipped(request, settings), 'customer_shipped');
}

export async function setSampleStatus(id: string, status: SampleRequestStatus, note?: string) {
  const patch: Record<string, unknown> = { status };
  if (status === 'delivered') patch.delivered_at = new Date().toISOString();
  const { error } = await db().from('sample_requests').update(patch).eq('id', id);
  if (error) throw error;
  await logSampleEvent(id, 'status', `Status changed to ${SAMPLE_STATUS_LABELS[status]}${note ? `: ${note.slice(0, 500)}` : ''}`);
}

export const normalizeSupplierRef = (value: unknown) => String(value ?? '').trim().replace(/^#\s*/, '');

export async function setSampleSupplierRefs(id: string, refs: { orderNumber?: unknown; invoiceNumber?: unknown }) {
  const patch: Record<string, string | null> = {};
  const notes: string[] = [];
  if (refs.orderNumber !== undefined) {
    patch.supplier_order_number = normalizeSupplierRef(refs.orderNumber) || null;
    notes.push(patch.supplier_order_number ? `supplier order ref #${patch.supplier_order_number}` : 'supplier order ref # cleared');
  }
  if (refs.invoiceNumber !== undefined) {
    patch.supplier_invoice_number = normalizeSupplierRef(refs.invoiceNumber) || null;
    notes.push(patch.supplier_invoice_number ? `supplier invoice #${patch.supplier_invoice_number}` : 'supplier invoice # cleared');
  }
  if (notes.length === 0) return;
  const { error } = await db().from('sample_requests').update(patch).eq('id', id);
  if (error) throw error;
  await logSampleEvent(id, 'supplier_order', `Linked: ${notes.join(', ')}`);
}
