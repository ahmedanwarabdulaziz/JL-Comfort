import { NextResponse } from 'next/server';
import { CheckoutError } from '@/lib/checkout/errors';
import {
  getEmailSettings,
  getOrder,
  logOrderEvent,
  markOrderShipped,
  resendShippedEmail,
  sendCustomerConfirmation,
  sendSupplierPurchaseOrder,
  setOrderStatus,
} from '@/lib/orders/server';
import { CARRIERS, ORDER_STATUS_LABELS, OrderStatus } from '@/lib/types/order';

// Admin order actions that send email or need the service role. Auth is enforced by middleware.ts
// (matcher covers /api/admin/:path*) before this handler runs.

const MANUAL_STATUSES: OrderStatus[] = ['paid', 'sent_to_supplier', 'shipped', 'delivered', 'closed', 'cancelled', 'problem'];
const STATUS_TIMESTAMPS: Partial<Record<OrderStatus, string>> = { delivered: 'delivered_at', closed: 'closed_at' };

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const order = await getOrder(params.id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'pending_payment' || order.status === 'expired') {
      return NextResponse.json({ error: 'This order was never paid.' }, { status: 400 });
    }

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
        ok = await markOrderShipped(order.id, carrier, trackingNumber, customUrl);
        break;
      }
      case 'resend_supplier_po': {
        const result = await sendSupplierPurchaseOrder(order, await getEmailSettings());
        ok = !result.startsWith('NOT SENT');
        break;
      }
      case 'resend_confirmation':
        ok = await sendCustomerConfirmation(order, await getEmailSettings());
        break;
      case 'resend_shipped':
        ok = await resendShippedEmail(order);
        break;
      case 'set_status': {
        const status = body.status as OrderStatus;
        if (!MANUAL_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        const timestampColumn = STATUS_TIMESTAMPS[status];
        await setOrderStatus(order.id, status, timestampColumn ? { [timestampColumn]: new Date().toISOString() } : {});
        await logOrderEvent(order.id, 'status', `Status changed to ${ORDER_STATUS_LABELS[status]}${body.note ? `: ${String(body.note).slice(0, 500)}` : ''}`);
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ ok, order: await getOrder(order.id) });
  } catch (error: any) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Admin order action failed:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
