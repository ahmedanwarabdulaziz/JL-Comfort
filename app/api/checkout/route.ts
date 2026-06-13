import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_to_pass_build', {
  apiVersion: '2026-05-27.dahlia' as any, // Bypass strict TS check
});

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Prepare line items for Stripe
    const lineItems = items.map((item: any) => {
      // Build a detailed description of the custom foam order
      const description = `Dims: ${item.dimensions.thickness}" x ${item.dimensions.rawDepth}" x ${item.dimensions.rawWidth}" | Grade: ${item.gradeName || 'None'}${item.wrapName ? ` | Wrap: ${item.wrapName}` : ''}`;

      return {
        price_data: {
          currency: 'usd', // Adjust currency as needed (e.g. 'egp' if supported, but usually 'usd' for demo)
          product_data: {
            name: `${item.categoryName} - ${item.typeName}`,
            description: description,
          },
          // Stripe requires the unit amount in cents (or the smallest currency unit)
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/foam`,
      metadata: {
        // You can store custom metadata here if needed for webhook processing
        order_source: 'jl_comfort_custom_foam',
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
