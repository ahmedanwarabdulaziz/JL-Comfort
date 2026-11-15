import { NextResponse } from 'next/server';
import { CheckoutError } from '@/lib/checkout/errors';
import { runOrderAction } from '@/lib/orders/actions';
import { getOrder } from '@/lib/orders/server';

// Admin order actions that send email or need the service role. Auth is enforced by middleware.ts
// (matcher covers /api/admin/:path*) before this handler runs. The actions themselves live in
// lib/orders/actions.ts (shared with the Anwarz app's /api/anwarz/orders/[id]).

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const order = await getOrder(params.id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const ok = await runOrderAction(order, body);
    return NextResponse.json({ ok, order: await getOrder(order.id) });
  } catch (error: any) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Admin order action failed:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
