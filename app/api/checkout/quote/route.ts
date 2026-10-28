import { NextResponse } from 'next/server';
import { CheckoutError, quoteCart } from '@/lib/checkout/quote';
import { alertCheckoutBlocked, describeCheckoutAttempt, reportError } from '@/lib/alerts/server';

// Shipping + tax preview for the checkout shipping page. /api/checkout recomputes the same quote
// server-side when creating the Stripe session, so nothing here is trusted later.
export async function POST(req: Request) {
  let attempt = ''; // who was checking out, for an alert if this fails
  try {
    const { items, country, region, discountCode, email } = await req.json();
    attempt = describeCheckoutAttempt(email, items);
    if (!country || !region) {
      return NextResponse.json({ error: 'Country and province/state are required.' }, { status: 400 });
    }
    const { quote } = await quoteCart(items, String(country).toUpperCase(), String(region).toUpperCase(), {
      discountCode: typeof discountCode === 'string' ? discountCode : undefined,
      email: typeof email === 'string' ? email : undefined,
    });
    return NextResponse.json(quote);
  } catch (error: any) {
    if (error instanceof CheckoutError) {
      await alertCheckoutBlocked('shipping & tax', error.message, attempt);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Checkout quote error:', error);
    await reportError('checkout_failed', 'Shipping & tax could not be calculated: a customer is stuck at checkout', `${error?.message || error}${attempt ? `
${attempt}` : ''}`);
    return NextResponse.json({ error: 'Unable to calculate shipping and tax.' }, { status: 500 });
  }
}
