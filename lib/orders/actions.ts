import { CheckoutError } from '@/lib/checkout/errors';
import {
  getEmailSettings,
  logOrderEvent,
  markOrderShipped,
  normalizeSupplierRef,
  resendShippedEmail,
  sendCustomerConfirmation,
  sendSupplierPurchaseOrder,
  setOrderEmailEnquiry,
  setOrderStatus,
  setSupplierRefs,
} from '@/lib/orders/server';
import { CARRIERS, ORDER_STATUS_LABELS, Order, OrderStatus } from '@/lib/types/order';

// Order actions that send email or change status, shared by the admin panel (/api/admin/orders/[id])
// and the Anwarz app (/api/anwarz/orders/[id]). Bad input throws a CheckoutError with a message
// meant for the person pressing the button.

export const MANUAL_ORDER_STATUSES: OrderStatus[] = ['paid', 'sent_to_supplier', 'shipped', 'delivered', 'closed', 'cancelled', 'problem'];
const STATUS_TIMESTAMPS: Partial<Record<OrderStatus, string>> = { delivered: 'delivered_at', closed: 'closed_at' };

/** Runs one action; returns false when an email it tried to send failed. */
export async function runOrderAction(order: Order, body: Record<string, unknown>): Promise<boolean> {
  if (order.status === 'pending_payment' || order.status === 'expired') throw new CheckoutError('This order was never paid.');

  switch (body.action) {
    // "This customer emailed us before ordering" -- only a person reading the inbox can know it.
    case 'set_email_enquiry': {
      const value = !!body.value;
      if (value === order.emailEnquiry) return true;
      await setOrderEmailEnquiry(order.id, value);
      await logOrderEvent(order.id, 'source', value ? 'Tagged: customer emailed an enquiry before ordering' : 'Untagged: email enquiry');
      return true;
    }
    case 'ship': {
      const trackingNumber = String(body.trackingNumber || '').trim();
      const carrier = String(body.carrier || '').trim();
      const customUrl = body.trackingUrl ? String(body.trackingUrl).trim() : undefined;
      if (!trackingNumber) throw new CheckoutError('Enter a tracking number.');
      if (!CARRIERS.some((c) => c.id === carrier) && !customUrl) throw new CheckoutError('Choose a carrier, or enter a tracking link for other carriers.');
      if (customUrl && !/^https:\/\//i.test(customUrl)) throw new CheckoutError('The tracking link must start with https://');
      const invoiceNumber = normalizeSupplierRef(body.supplierInvoiceNumber);
      if (invoiceNumber && invoiceNumber !== order.supplierInvoiceNumber) await setSupplierRefs(order.id, { invoiceNumber });
      return markOrderShipped(order.id, carrier, trackingNumber, customUrl);
    }
    case 'set_supplier_refs':
      await setSupplierRefs(order.id, {
        orderNumber: normalizeSupplierRef(body.supplierOrderNumber) === (order.supplierOrderNumber || '') ? undefined : body.supplierOrderNumber,
        invoiceNumber: normalizeSupplierRef(body.supplierInvoiceNumber) === (order.supplierInvoiceNumber || '') ? undefined : body.supplierInvoiceNumber,
      });
      return true;
    case 'resend_supplier_po': {
      const result = await sendSupplierPurchaseOrder(order, await getEmailSettings());
      return !result.startsWith('NOT SENT');
    }
    case 'resend_confirmation':
      return sendCustomerConfirmation(order, await getEmailSettings());
    case 'resend_shipped':
      return resendShippedEmail(order);
    case 'set_status': {
      const status = body.status as OrderStatus;
      if (!MANUAL_ORDER_STATUSES.includes(status)) throw new CheckoutError('Invalid status');
      const timestampColumn = STATUS_TIMESTAMPS[status];
      await setOrderStatus(order.id, status, timestampColumn ? { [timestampColumn]: new Date().toISOString() } : {});
      await logOrderEvent(order.id, 'status', `Status changed to ${ORDER_STATUS_LABELS[status]}${body.note ? `: ${String(body.note).slice(0, 500)}` : ''}`);
      return true;
    }
    default:
      throw new CheckoutError('Unknown action');
  }
}
