import { CheckoutError } from '@/lib/checkout/errors';
import { getEmailSettings } from '@/lib/email/deliver';
import {
  logSampleEvent,
  markSamplesShipped,
  normalizeSupplierRef,
  resendSamplesShippedEmail,
  sendCustomerSampleConfirmation,
  sendCustomerSamplesConfirmed,
  sendSupplierSampleRequest,
  setSampleStatus,
  setSampleSupplierRefs,
} from '@/lib/samples/server';
import { CARRIERS } from '@/lib/types/order';
import { SampleRequest, SampleRequestStatus } from '@/lib/types/sampleRequest';

// Sample request actions that send email or change status, shared by the admin panel
// (/api/admin/sample-requests/[id]) and the Anwarz app (/api/anwarz/samples/[id]).

export const MANUAL_SAMPLE_STATUSES: SampleRequestStatus[] = ['pending', 'sent_to_supplier', 'supplier_confirmed', 'shipped', 'delivered', 'cancelled', 'problem'];

/** Runs one action; returns false when an email it tried to send failed. */
export async function runSampleAction(request: SampleRequest, body: Record<string, unknown>): Promise<boolean> {
  switch (body.action) {
    case 'ship': {
      const trackingNumber = String(body.trackingNumber || '').trim();
      const carrier = String(body.carrier || '').trim();
      const customUrl = body.trackingUrl ? String(body.trackingUrl).trim() : undefined;
      if (!trackingNumber) throw new CheckoutError('Enter a tracking number.');
      if (!CARRIERS.some((c) => c.id === carrier) && !customUrl) throw new CheckoutError('Choose a carrier, or enter a tracking link for other carriers.');
      if (customUrl && !/^https:\/\//i.test(customUrl)) throw new CheckoutError('The tracking link must start with https://');
      const invoiceNumber = normalizeSupplierRef(body.supplierInvoiceNumber);
      if (invoiceNumber && invoiceNumber !== request.supplierInvoiceNumber) await setSampleSupplierRefs(request.id, { invoiceNumber });
      return markSamplesShipped(request.id, carrier, trackingNumber, customUrl);
    }
    case 'set_supplier_refs':
      await setSampleSupplierRefs(request.id, {
        orderNumber: normalizeSupplierRef(body.supplierOrderNumber) === (request.supplierOrderNumber || '') ? undefined : body.supplierOrderNumber,
        invoiceNumber: normalizeSupplierRef(body.supplierInvoiceNumber) === (request.supplierInvoiceNumber || '') ? undefined : body.supplierInvoiceNumber,
      });
      return true;
    // Charlotte's "Sample Request Confirmation" email has no reference number, so it is marked by
    // hand; the same action resends the customer email later if needed.
    case 'supplier_confirmed':
      if (['delivered', 'cancelled'].includes(request.status)) throw new CheckoutError('This request is already delivered or cancelled.');
      await logSampleEvent(request.id, 'supplier_confirmed', 'Marked as confirmed by Charlotte');
      // Flag it: Sent to supplier -> Confirmed by supplier (never moves a shipped request back).
      if (['pending', 'sent_to_supplier', 'problem'].includes(request.status)) {
        try {
          await setSampleStatus(request.id, 'supplier_confirmed');
        } catch (error: any) {
          // e.g. the status migration has not been run yet; the customer email still goes out.
          await logSampleEvent(request.id, 'error', `Could not set status to Confirmed by supplier: ${error?.message || error}`);
        }
      }
      return sendCustomerSamplesConfirmed(request);
    case 'resend_supplier': {
      const result = await sendSupplierSampleRequest(request, await getEmailSettings());
      return !result.startsWith('NOT SENT');
    }
    case 'resend_confirmation':
      return sendCustomerSampleConfirmation(request, await getEmailSettings());
    case 'resend_shipped':
      return resendSamplesShippedEmail(request);
    case 'set_status': {
      const status = body.status as SampleRequestStatus;
      if (!MANUAL_SAMPLE_STATUSES.includes(status)) throw new CheckoutError('Invalid status');
      await setSampleStatus(request.id, status, body.note ? String(body.note) : undefined);
      return true;
    }
    default:
      throw new CheckoutError('Unknown action');
  }
}
