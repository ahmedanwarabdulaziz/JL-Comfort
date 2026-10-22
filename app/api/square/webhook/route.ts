import { NextResponse } from 'next/server';
import { markOrderPaid, sendNewOrderEmails } from '@/lib/orders/server';
import { reportPurchaseServerSide } from '@/lib/analytics/serverConversions';
import { reportError } from '@/lib/alerts/server';
import { SQUARE_REF_PREFIX, getSquarePayment, isSquareWebhookConfigured, verifySquareWebhook } from '@/lib/square/server';

// Square's counterpart to /api/stripe/webhook: it marks an order paid even if the shopper never
// makes it back to /success. Subscribe in the Square developer dashboard (Webhooks -> Subscriptions)
// to the payment.updated event with this URL; its signature key goes in SQUARE_WEBHOOK_SIGNATURE_KEY.
// A second subscription in the Sandbox view covers admin test checkouts: SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY.
// The signature covers the URL as registered, so it's rebuilt from SITE_URL (override with
// SQUARE_WEBHOOK_URL if the subscription uses a different address).
export async function POST(req: Request) {
  if (!isSquareWebhookConfigured()) {
    console.error('SQUARE_WEBHOOK_SIGNATURE_KEY is not set; rejecting webhook.');
    await reportError('webhook_failed', 'Square webhook rejected: not configured', 'SQUARE_WEBHOOK_SIGNATURE_KEY is not set, so payments are not being confirmed.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const payload = await req.text();
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_URL?.trim() || `${(process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, '')}/api/square/webhook`;
  const verified = verifySquareWebhook(notificationUrl, payload, req.headers.get('x-square-hmacsha256-signature') || '');
  if (!verified) {
    return NextResponse.json({ error: `Invalid signature (checked against ${notificationUrl})` }, { status: 400 });
  }
  const { testMode } = verified;

  const event = JSON.parse(payload);
  const payment = event?.data?.object?.payment;
  if (event?.type !== 'payment.updated' || payment?.status !== 'COMPLETED' || !payment.order_id) {
    return NextResponse.json({ received: true, ignored: event?.type });
  }

  let orderId: string | null = null;
  try {
    // The event is only a nudge: what was paid, and for which of our orders, is read back from Square.
    const result = await getSquarePayment(payment.order_id, testMode);
    orderId = result.orderId;
    if (!orderId || !result.paid) return NextResponse.json({ received: true, ignored: 'not a paid store order' });

    const firstDelivery = await markOrderPaid(orderId, {
      sessionId: SQUARE_REF_PREFIX + result.squareOrderId,
      paymentIntentId: result.paymentId,
      taxCents: result.taxCents,
      totalCents: result.totalCents,
    }, testMode);
    if (firstDelivery) {
      const origin = process.env.SITE_URL || new URL(req.url).origin;
      await sendNewOrderEmails(orderId, origin);
      await reportPurchaseServerSide(orderId);
    }
  } catch (error) {
    // A 500 makes Square retry later; markOrderPaid's status guard keeps a retry from double-sending.
    console.error(`Square webhook failed for order ${orderId || payment.order_id}:`, error);
    await reportError('webhook_failed', 'Square webhook failed', error, orderId ? `/admin/orders?order=${orderId}` : undefined);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
