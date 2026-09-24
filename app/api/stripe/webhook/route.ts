import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { markOrderExpired, markOrderPaid, sendNewOrderEmails } from '@/lib/orders/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_to_pass_build', {
  apiVersion: '2026-05-27.dahlia' as any, // Bypass strict TS check
});

// Stripe calls this after checkout. It is the only thing that marks an order paid -- the /success
// redirect can be skipped (closed tab, lost connection), this can't. The signature check proves the
// request came from Stripe; register the endpoint in the Stripe dashboard for these events:
//   checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set; rejecting webhook.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, req.headers.get('stripe-signature') || '', secret);
  } catch (error: any) {
    return NextResponse.json({ error: `Invalid signature: ${error.message}` }, { status: 400 });
  }

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
      });
      if (firstDelivery) {
        const origin = process.env.SITE_URL || new URL(req.url).origin;
        await sendNewOrderEmails(orderId, origin);
      }
    } else if (event.type === 'checkout.session.expired') {
      await markOrderExpired(orderId);
    }
  } catch (error) {
    // A 500 makes Stripe retry later; markOrderPaid's status guard keeps a retry from double-sending.
    console.error(`Stripe webhook ${event.type} failed for order ${orderId}:`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
