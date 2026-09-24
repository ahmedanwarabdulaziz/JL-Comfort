import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CheckoutError, quoteCart } from '@/lib/checkout/quote';
import { isCheckoutRegion } from '@/lib/checkout/regions';
import { TaxRate } from '@/lib/types/checkout';
import { attachCheckoutSession, createPendingOrder, markOrderExpired } from '@/lib/orders/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_to_pass_build', {
  apiVersion: '2026-05-27.dahlia' as any, // Bypass strict TS check
});

// Every price in the store (fabric, foam, cushions, shipping) is entered in Canadian dollars.
const CURRENCY = 'cad';

// Stripe TaxRate objects are immutable, so each distinct (region, tax, percentage) gets its own one,
// tagged with a metadata key and reused. Editing a rate in the admin panel simply mints a new
// TaxRate the next time it's used. Cached per server instance to skip the lookup on warm requests.
const stripeTaxRateIds = new Map<string, string>();
const taxRateKey = (tax: TaxRate) => `${tax.country}-${tax.regionCode}-${tax.taxName}-${tax.rate}`;
const STRIPE_TAX_TYPES = new Set(['gst', 'hst', 'pst', 'qst', 'rst', 'vat']);

async function resolveStripeTaxRates(taxRates: TaxRate[]): Promise<Map<string, string>> {
  const missing = taxRates.filter((tax) => !stripeTaxRateIds.has(taxRateKey(tax)));
  if (missing.length > 0) {
    for await (const existing of stripe.taxRates.list({ active: true, inclusive: false, limit: 100 })) {
      if (existing.metadata?.jl_key) stripeTaxRateIds.set(existing.metadata.jl_key, existing.id);
    }
    for (const tax of missing) {
      const key = taxRateKey(tax);
      if (stripeTaxRateIds.has(key)) continue;
      const taxType = tax.taxName.toLowerCase();
      const created = await stripe.taxRates.create({
        display_name: tax.taxName,
        percentage: tax.rate,
        inclusive: false,
        country: tax.country,
        state: tax.regionCode,
        jurisdiction: tax.regionName,
        tax_type: (STRIPE_TAX_TYPES.has(taxType) ? taxType : tax.country === 'US' ? 'sales_tax' : undefined) as any,
        metadata: { jl_key: key },
      });
      stripeTaxRateIds.set(key, created.id);
    }
  }
  return new Map(taxRates.map((tax) => [tax.id, stripeTaxRateIds.get(taxRateKey(tax))!]));
}

export async function POST(req: Request) {
  try {
    const { items, origin: clientOrigin, shippingAddress } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    if (!shippingAddress || shippingAddress.country !== 'CA') {
      return NextResponse.json({ error: 'At this time, JL Comfort ships to Canada only.' }, { status: 400 });
    }
    const country: string = shippingAddress.country;
    const region = String(shippingAddress.province || '').toUpperCase();
    if (!isCheckoutRegion(country, region)) {
      return NextResponse.json({ error: 'Please choose a valid province or territory.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(shippingAddress.email || '').trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!shippingAddress.name || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.postalCode) {
      return NextResponse.json({ error: 'Please complete your delivery address.' }, { status: 400 });
    }

    const { quote, lines, shippingRate, taxRates } = await quoteCart(items, country, region);
    const stripeTaxRateIdsById = await resolveStripeTaxRates(taxRates);
    const productTaxRates = taxRates.map((tax) => stripeTaxRateIdsById.get(tax.id)!);
    const shippingTaxRates = taxRates
      .filter((tax) => tax.appliesToShipping)
      .map((tax) => stripeTaxRateIdsById.get(tax.id)!);

    // Line items come only from the server-priced cart -- names, descriptions and amounts alike.
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((line) => ({
      price_data: {
        currency: CURRENCY,
        product_data: {
          name: line.name,
          description: line.description || undefined,
        },
        unit_amount: line.unitPriceCents,
      },
      quantity: line.quantity,
      tax_rates: productTaxRates.length > 0 ? productTaxRates : undefined,
    }));

    // Shipping goes in as its own line item (rather than a Checkout shipping option) because Stripe
    // only applies manual tax rates to line items, and GST/HST is charged on shipping in Canada.
    if (quote.shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: 'Shipping',
            description: `Standard delivery, ${shippingRate.deliveryMinDays}–${shippingRate.deliveryMaxDays} business days`,
          },
          unit_amount: quote.shippingCents,
        },
        quantity: 1,
        tax_rates: shippingTaxRates.length > 0 ? shippingTaxRates : undefined,
      });
    }

    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const serverOrigin = host ? `${protocol}://${host}` : 'http://localhost:3000';
    const finalOrigin = clientOrigin || req.headers.get('origin') || serverOrigin;

    const order = await createPendingOrder(lines, quote, {
      email: String(shippingAddress.email || '').trim(),
      name: String(shippingAddress.name).trim(),
      phone: shippingAddress.phone ? String(shippingAddress.phone).trim() : undefined,
      line1: String(shippingAddress.line1).trim(),
      line2: shippingAddress.line2 ? String(shippingAddress.line2).trim() : undefined,
      city: String(shippingAddress.city).trim(),
      region,
      postalCode: String(shippingAddress.postalCode).trim().toUpperCase(),
      country,
    });

    // The delivery address is collected once on /checkout/shipping (it decides shipping and tax), so
    // Stripe doesn't ask for it again -- it's attached to the payment as the shipping address.
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        billing_address_collection: 'required',
        client_reference_id: order.id,
        payment_intent_data: {
          description: `JL Comfort order ${order.orderNumber}`,
          metadata: { order_id: order.id, order_number: order.orderNumber },
          shipping: {
            name: shippingAddress.name,
            phone: shippingAddress.phone || undefined,
            address: {
              line1: shippingAddress.line1,
              line2: shippingAddress.line2 || undefined,
              city: shippingAddress.city,
              state: region,
              postal_code: String(shippingAddress.postalCode).toUpperCase(),
              country,
            },
          },
        },
        customer_email: shippingAddress?.email,
        success_url: `${finalOrigin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${finalOrigin}/checkout`,
        metadata: {
          order_id: order.id,
          order_number: order.orderNumber,
          shipping_region: `${country}-${region}`,
        },
      });
    } catch (stripeError) {
      await markOrderExpired(order.id);
      throw stripeError;
    }
    await attachCheckoutSession(order.id, session.id);

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
