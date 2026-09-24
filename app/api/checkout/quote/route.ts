import { NextResponse } from 'next/server';
import { CheckoutError, quoteCart } from '@/lib/checkout/quote';

// Shipping + tax preview for the checkout shipping page. /api/checkout recomputes the same quote
// server-side when creating the Stripe session, so nothing here is trusted later.
export async function POST(req: Request) {
  try {
    const { items, country, region } = await req.json();
    if (!country || !region) {
      return NextResponse.json({ error: 'Country and province/state are required.' }, { status: 400 });
    }
    const { quote } = await quoteCart(items, String(country).toUpperCase(), String(region).toUpperCase());
    return NextResponse.json(quote);
  } catch (error: any) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Checkout quote error:', error);
    return NextResponse.json({ error: 'Unable to calculate shipping and tax.' }, { status: 500 });
  }
}
