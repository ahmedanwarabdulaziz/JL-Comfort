import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { markOrderExpired, markOrderPaid, sendNewOrderEmails } from '@/lib/orders/server';
import { reportPurchaseServerSide } from '@/lib/analytics/serverConversions';


// Stripe calls this after checkout. It is the only thing that marks an order paid -- the /success
// redirect can be skipped (closed tab, lost connection), this can't. The signature check proves the
// request came from Stripe; register the endpoint in the Stripe dashboard for these events:
//   checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired
// Admin test checkouts (lib/stripe/testMode.ts) need the same endpoint registered again in the
// Stripe dashboard's test mode; its signing secret goes in STRIPE_TEST_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET?.trim(), process.env.STRIPE_TEST_WEBHOOK_SECRET?.trim()].filter(Boolean) as string[];
  if (secrets.length === 0) {
    console.error('STRIPE_WEBHOOK_SECRET is not set; rejecting webhook.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  let event: Stripe.Event | null = null;
  let signatureError = '';
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(payload, signature, secret);
      break;
    } catch (error: any) {
      signatureError = error.message;
    }
  }
  if (!event) {
    return NextResponse.json({ error: `Invalid signature: ${signatureError}` }, { status: 400 });
  }
  // Stripe marks every event with the mode it happened in; markOrderPaid uses it so a test payment
  // can never mark a real order paid.
  const testMode = !event.livemode;

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id || session.client_reference_id;
  if (!orderId || !event.type.startsWith('checkout.session.')) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  try {
    if (
      (event.type === 'checkout.session.completed' && session.payment_status === 'paid') ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const firstDelivery = await markOrderPaid(orderId, {
        sessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
        taxCents: session.total_details?.amount_tax ?? null,
        totalCents: session.amount_total ?? null,
      }, testMode);
      if (firstDelivery) {
        const origin = process.env.SITE_URL || new URL(req.url).origin;
        await sendNewOrderEmails(orderId, origin);
        await reportPurchaseServerSide(orderId);
      }
    } else if (event.type === 'checkout.session.expired') {
      await markOrderExpired(orderId, testMode);
    }
  } catch (error) {
    // A 500 makes Stripe retry later; markOrderPaid's status guard keeps a retry from double-sending.
    console.error(`Stripe webhook ${event.type} failed for order ${orderId}:`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
