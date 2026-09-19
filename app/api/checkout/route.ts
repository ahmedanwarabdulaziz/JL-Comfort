import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_to_pass_build', {
  apiVersion: '2026-05-27.dahlia' as any, // Bypass strict TS check
});

export async function POST(req: Request) {
  try {
    const { items, origin: clientOrigin, shippingAddress } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    if (!shippingAddress || shippingAddress.country !== 'CA') {
      return NextResponse.json({ error: 'At this time, JL Comfort ships to Canada only.' }, { status: 400 });
    }

    // Prepare line items for Stripe
    const lineItems = items.map((item: any) => {
      let name: string;
      let description: string;

      if (item.productType === 'fabric') {
        name = item.fabricName || 'Fabric';
        description = `${item.fabricSku ? `SKU ${item.fabricSku} — ` : ''}${item.quantity} yard${item.quantity === 1 ? '' : 's'}`;
      } else if (item.productType === 'benchCushion') {
        name = item.cushionStyleName || 'Bench Cushion';
        const dims = item.cushionDimensions
          ? Object.entries(item.cushionDimensions)
              .map(([dimName, value]) => `${dimName}: ${value}"`)
              .join(', ')
          : '';
        const options = (item.cushionOptions || [])
          .map((o: { groupName: string; choiceLabel: string }) => `${o.groupName}: ${o.choiceLabel}`)
          .join(', ');
        const fabric = item.fabric
          ? `Fabric: ${item.fabric.name}${item.fabric.tierName ? ` (${item.fabric.tierName})` : ''}${
              typeof item.fabric.cost === 'number' ? ` +$${item.fabric.cost.toFixed(2)}` : ''
            }`
          : '';
        description = [dims, options, fabric].filter(Boolean).join(' | ');
      } else {
        // Build a detailed description of the custom foam order
        name = `${item.categoryName} - ${item.typeName}`;
        description = `Dims: ${item.dimensions.thickness}" x ${item.dimensions.rawDepth}" x ${item.dimensions.rawWidth}" | Grade: ${item.gradeName || 'None'}${item.wrapName ? ` | Wrap: ${item.wrapName}` : ''}`;
      }

      return {
        price_data: {
          currency: 'usd', // Adjust currency as needed (e.g. 'egp' if supported, but usually 'usd' for demo)
          product_data: {
            name,
            description,
          },
          // Stripe requires the unit amount in cents (or the smallest currency unit)
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const serverOrigin = host ? `${protocol}://${host}` : 'http://localhost:3000';
    const finalOrigin = clientOrigin || req.headers.get('origin') || serverOrigin;

    const shippingAmountCents = process.env.CANADA_STANDARD_SHIPPING_CENTS;
    if (shippingAmountCents === undefined) {
      return NextResponse.json(
        { error: 'Canada shipping is not configured yet. Please contact JL Comfort.' },
        { status: 503 }
      );
    }

    const shippingCents = Number(shippingAmountCents);
    if (!Number.isInteger(shippingCents) || shippingCents < 0) {
      return NextResponse.json({ error: 'Invalid Canada shipping configuration.' }, { status: 500 });
    }

    // Stripe uses the collected Canadian shipping address to calculate
    // registered GST/HST and provincial taxes.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['CA'] },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: shippingCents, currency: 'usd' },
          display_name: 'Standard delivery',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 7 },
          },
        },
      }],
      customer_email: shippingAddress?.email,
      success_url: `${finalOrigin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${finalOrigin}/foam`,
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
