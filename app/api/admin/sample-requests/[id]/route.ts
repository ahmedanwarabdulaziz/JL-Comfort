import { NextResponse } from 'next/server';
import { CheckoutError } from '@/lib/checkout/errors';
import { runSampleAction } from '@/lib/samples/actions';
import { getSampleRequest } from '@/lib/samples/server';

// Admin sample request actions. Auth is enforced by middleware.ts (matcher covers /api/admin/:path*).
// The actions themselves live in lib/samples/actions.ts (shared with /api/anwarz/samples/[id]).

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const request = await getSampleRequest(params.id);
    if (!request) return NextResponse.json({ error: 'Sample request not found' }, { status: 404 });
    const ok = await runSampleAction(request, body);
    return NextResponse.json({ ok });
  } catch (error: any) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Admin sample request action failed:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
