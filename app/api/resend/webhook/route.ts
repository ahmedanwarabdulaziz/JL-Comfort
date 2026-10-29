import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AlertLevel, recordAlert, reportError } from '@/lib/alerts/server';
import { VERIFIED_SENDING_DOMAINS } from '@/lib/types/order';

// Resend reports what happened to an email after it accepted it: a purchase order, confirmation or
// sample request that bounces would otherwise fail silently, since the order history only records
// that Resend took the email. Add this URL in Resend -> Webhooks with the email.bounced,
// email.complained and email.failed events, and put its signing secret in RESEND_WEBHOOK_SECRET.
// Each event is matched to its order or sample request through the "Resend id" that
// lib/email/deliver.ts writes in the history, logged there, and sent as a Telegram alert.

const EVENTS: Record<string, { level: AlertLevel; label: string }> = {
  'email.bounced': { level: 'error', label: 'Email bounced' },
  'email.failed': { level: 'error', label: 'Email failed to send' },
  'email.complained': { level: 'warning', label: 'Email marked as spam' },
};

// Resend signs webhooks the Svix way: HMAC-SHA256 of "<id>.<timestamp>.<body>" with the base64 key
// after "whsec_", sent as one or more space-separated "v1,<signature>" values.
const TOLERANCE_SECONDS = 5 * 60;
function verifySignature(secret: string, id: string, timestamp: string, body: string, header: string) {
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!id || !Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();
  return header.split(' ').some((part) => {
    const [version, signature] = part.split(',');
    if (version !== 'v1' || !signature) return false;
    const given = Buffer.from(signature, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/** The order or sample request whose history mentions this Resend id, if any. */
async function findOwner(emailId: string) {
  if (!supabaseAdmin || !/^[0-9a-f-]{8,64}$/i.test(emailId)) return null;
  const pattern = `%Resend id ${emailId}%`;
  const { data: orderEvent } = await supabaseAdmin
    .from('order_events').select('order_id, orders(order_number, is_test)').ilike('message', pattern).limit(1).maybeSingle();
  if (orderEvent) {
    const order = (orderEvent as any).orders;
    return {
      table: 'order_events' as const, column: 'order_id', id: orderEvent.order_id as string,
      label: `Order ${order?.order_number || ''}`.trim(), isTest: !!order?.is_test,
      link: `/admin/orders?order=${orderEvent.order_id}`,
    };
  }
  const { data: sampleEvent } = await supabaseAdmin
    .from('sample_request_events').select('sample_request_id, sample_requests(request_number)').ilike('message', pattern).limit(1).maybeSingle();
  if (sampleEvent) {
    const request = (sampleEvent as any).sample_requests;
    return {
      table: 'sample_request_events' as const, column: 'sample_request_id', id: sampleEvent.sample_request_id as string,
      label: `Sample request ${request?.request_number || ''}`.trim(), isTest: false,
      link: `/admin/sample-requests?request=${sampleEvent.sample_request_id}`,
    };
  }
  return null;
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET is not set; rejecting webhook.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  const svixId = req.headers.get('svix-id') || '';
  if (!verifySignature(secret, svixId, req.headers.get('svix-timestamp') || '', body, req.headers.get('svix-signature') || '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);
  const kind = EVENTS[event?.type];
  if (!kind) return NextResponse.json({ received: true, ignored: event?.type });

  const data = event.data || {};
  // The Resend account also sends the JL Upholstery site's email, and its webhooks report every
  // email in the account. Only alert on email this site sent, i.e. from a JL Comfort address.
  const fromDomain = String(data.from || '').match(/@([^>\s]+)>?\s*$/)?.[1]?.toLowerCase() || '';
  if (!VERIFIED_SENDING_DOMAINS.includes(fromDomain)) {
    return NextResponse.json({ received: true, ignored: `sent from ${fromDomain || 'an unknown address'}` });
  }
  const emailId: string = data.email_id || '';
  const subject: string = data.subject || '(no subject)';
  const recipients = [...(data.to || []), ...(data.bcc || [])].join(', ');
  const reason = [data.bounce?.type, data.bounce?.subType, data.bounce?.message || data.failed?.reason].filter(Boolean).join(' · ');

  try {
    const owner = await findOwner(emailId);
    const message = `${kind.label}: "${subject}" to ${recipients}${reason ? ` -- ${reason}` : ''} (Resend id ${emailId})`;

    if (owner && supabaseAdmin) {
      // Resend retries a webhook until it gets a 2xx, so skip one this history already has.
      const { data: existing } = await supabaseAdmin
        .from(owner.table).select('id').eq(owner.column, owner.id).eq('type', event.type).ilike('message', `%Resend id ${emailId}%`).limit(1);
      if (existing?.length) return NextResponse.json({ received: true, duplicate: true });
      const { error } = await supabaseAdmin.from(owner.table).insert({ [owner.column]: owner.id, type: event.type, message });
      if (error) console.error('Logging email event failed:', error);
    }

    await recordAlert({
      level: kind.level,
      type: event.type.replace('.', '_'),
      title: `${owner ? `${owner.label}: ` : ''}${kind.label.toLowerCase()}`,
      detail: `"${subject}"\nTo: ${recipients}${reason ? `\n${reason}` : ''}\nCheck the address, or resend from the admin once it's fixed.`,
      link: owner?.link,
      isTest: owner?.isTest,
      icon: '📧',
    });
  } catch (error) {
    await reportError('resend_webhook', 'Resend webhook: could not record an email problem', error);
  }
  return NextResponse.json({ received: true });
}
