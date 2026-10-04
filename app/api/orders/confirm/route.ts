import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { markOrderPaid, sendNewOrderEmails } from '@/lib/orders/server';
import { hashEmail, reportPurchaseServerSide } from '@/lib/analytics/serverConversions';


// Called by the /success page as a second path to confirm an order, next to the Stripe webhook:
// it covers a delayed webhook and local development (where Stripe can't reach the webhook).
// Nothing from the browser is trusted -- only the session id, which is looked up at Stripe itself.
// markOrderPaid's status guard means whichever of the two paths arrives first sends the emails.
export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.order_id || session.client_reference_id;
    if (!orderId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ orderNumber: session.metadata?.order_number || null, paid: false });
    }

    const firstConfirmation = await markOrderPaid(orderId, {
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      taxCents: session.total_details?.amount_tax ?? null,
      totalCents: session.amount_total ?? null,
    });
    if (firstConfirmation) {
      await sendNewOrderEmails(orderId, process.env.SITE_URL || new URL(req.url).origin);
      await reportPurchaseServerSide(orderId);
    }

    // Totals come from Stripe, not the browser, so the ad platforms get the amount actually charged.
    return NextResponse.json({
      orderNumber: session.metadata?.order_number || null,
      paid: true,
      totalCents: session.amount_total ?? null,
      taxCents: session.total_details?.amount_tax ?? null,
      // Hashed, for Google Ads enhanced conversions; the page sends it only with advertising consent.
      sha256Email: session.customer_details?.email || session.customer_email ? hashEmail((session.customer_details?.email || session.customer_email)!) : null,
    });
  } catch (error: any) {
    console.error('Order confirmation failed:', error);
    return NextResponse.json({ error: 'Unable to confirm the order' }, { status: 500 });
  }
}
