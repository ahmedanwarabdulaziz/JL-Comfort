import { NextResponse } from 'next/server';
import { CheckoutError } from '@/lib/checkout/errors';
import { getEmailSettings } from '@/lib/email/deliver';
import {
  getSampleRequest,
  markSamplesShipped,
  normalizeSupplierRef,
  resendSamplesShippedEmail,
  sendCustomerSampleConfirmation,
  sendSupplierSampleRequest,
  setSampleStatus,
  setSampleSupplierRefs,
} from '@/lib/samples/server';
import { CARRIERS } from '@/lib/types/order';
import { SampleRequestStatus } from '@/lib/types/sampleRequest';

// Admin sample request actions. Auth is enforced by middleware.ts (matcher covers /api/admin/:path*).

const MANUAL_STATUSES: SampleRequestStatus[] = ['pending', 'sent_to_supplier', 'shipped', 'delivered', 'cancelled', 'problem'];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const request = await getSampleRequest(params.id);
    if (!request) return NextResponse.json({ error: 'Sample request not found' }, { status: 404 });

    let ok = true;
    switch (body.action) {
      case 'ship': {
        const trackingNumber = String(body.trackingNumber || '').trim();
        const carrier = String(body.carrier || '').trim();
        const customUrl = body.trackingUrl ? String(body.trackingUrl).trim() : undefined;
        if (!trackingNumber) return NextResponse.json({ error: 'Enter a tracking number.' }, { status: 400 });
        if (!CARRIERS.some((c) => c.id === carrier) && !customUrl) {
          return NextResponse.json({ error: 'Choose a carrier, or enter a tracking link for other carriers.' }, { status: 400 });
        }
        if (customUrl && !/^https:\/\//i.test(customUrl)) {
          return NextResponse.json({ error: 'The tracking link must start with https://' }, { status: 400 });
        }
        const invoiceNumber = normalizeSupplierRef(body.supplierInvoiceNumber);
        if (invoiceNumber && invoiceNumber !== request.supplierInvoiceNumber) await setSampleSupplierRefs(request.id, { invoiceNumber });
        ok = await markSamplesShipped(request.id, carrier, trackingNumber, customUrl);
        break;
      }
      case 'set_supplier_refs':
        await setSampleSupplierRefs(request.id, {
          orderNumber: normalizeSupplierRef(body.supplierOrderNumber) === (request.supplierOrderNumber || '') ? undefined : body.supplierOrderNumber,
          invoiceNumber: normalizeSupplierRef(body.supplierInvoiceNumber) === (request.supplierInvoiceNumber || '') ? undefined : body.supplierInvoiceNumber,
        });
        break;
      case 'resend_supplier': {
        const result = await sendSupplierSampleRequest(request, await getEmailSettings());
        ok = !result.startsWith('NOT SENT');
        break;
      }
      case 'resend_confirmation':
        ok = await sendCustomerSampleConfirmation(request, await getEmailSettings());
        break;
      case 'resend_shipped':
        ok = await resendSamplesShippedEmail(request);
        break;
      case 'set_status': {
        const status = body.status as SampleRequestStatus;
        if (!MANUAL_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        await setSampleStatus(request.id, status, body.note ? String(body.note) : undefined);
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ ok });
  } catch (error: any) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Admin sample request action failed:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
