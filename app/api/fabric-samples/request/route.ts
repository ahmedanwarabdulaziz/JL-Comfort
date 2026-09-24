import { NextRequest, NextResponse } from 'next/server';
import { CheckoutError } from '@/lib/checkout/errors';
import { createSampleRequest, getSampleRequest, sendNewSampleRequestEmails } from '@/lib/samples/server';
import { SampleRequestInput } from '@/lib/types/sampleRequest';

// Public: stores a free sample request (limits from Admin → Sample Requests are enforced in
// createSampleRequest), then emails the supplier, the customer and the internal copy.
export async function POST(request: NextRequest) {
  let body: SampleRequestInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const id = await createSampleRequest(body);
    await sendNewSampleRequestEmails(id, process.env.SITE_URL || request.nextUrl.origin);
    const created = await getSampleRequest(id);
    return NextResponse.json({ id, requestNumber: created?.requestNumber || null });
  } catch (error: any) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Error creating sample request:', error);
    return NextResponse.json({ error: 'Failed to submit sample request.' }, { status: 500 });
  }
}
