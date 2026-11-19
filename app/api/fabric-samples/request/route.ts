import { NextRequest, NextResponse } from 'next/server';
import { CheckoutError } from '@/lib/checkout/errors';
import { createSampleRequest, getSampleRequest, sendNewSampleRequestEmails } from '@/lib/samples/server';
import { SampleRequestInput } from '@/lib/types/sampleRequest';
import { reportError } from '@/lib/alerts/server';
import { guardPublicForm } from '@/lib/security/guard';

// Public: stores a free sample request (limits from Admin → Sample Requests are enforced in
// createSampleRequest), then emails the supplier, the customer and the internal copy.
export async function POST(request: NextRequest) {
  // Each request emails Charlotte, so floods are stopped before anything is stored or sent.
  const refused = guardPublicForm(request, 'samples', 5, 60 * 60_000);
  if (refused) return refused;
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
    await reportError('sample_request_failed', 'A sample request could not be saved', error);
    return NextResponse.json({ error: 'Failed to submit sample request.' }, { status: 500 });
  }
}
