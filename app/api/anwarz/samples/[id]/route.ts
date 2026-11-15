import { CheckoutError } from '@/lib/checkout/errors';
import { anwarzRoute, anwarzSample } from '@/lib/anwarz/api';
import { runSampleAction } from '@/lib/samples/actions';
import { getSampleRequest } from '@/lib/samples/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Ctx = { params: { id: string } };

async function load(id: string) {
  const request = await getSampleRequest(id);
  if (!request) throw new CheckoutError('Sample request not found', 404);
  return request;
}

/** One sample request with its fabrics and history. */
export const GET = anwarzRoute<Ctx>(async (_request, { params }) => ({ sample: anwarzSample(await load(params.id), true) }));

/** Same actions as the admin panel (lib/samples/actions.ts): ship, set_supplier_refs, supplier_confirmed, resend_*, set_status. */
export const POST = anwarzRoute<Ctx>(async (request, { params }) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') throw new CheckoutError('Expected a JSON body.');
  const ok = await runSampleAction(await load(params.id), body);
  return { ok, sample: anwarzSample(await load(params.id), true) };
});
