import { COUNTRY_NAMES, EmailContent, block, escape, firstName, label, layout, p, trackButton } from '@/lib/email/layout';
import { EmailSettings } from '@/lib/types/order';
import { SampleRequest, SampleRequestItem } from '@/lib/types/sampleRequest';

// Sample request emails: the supplier request, the customer's confirmation, your copy, and the
// "shipped" notice. Samples are free, so nothing here shows a price.

const addressLines = (request: SampleRequest): string[] =>
  [
    request.name,
    request.address.line1,
    request.address.line2 || '',
    `${request.address.city} ${request.address.state} ${request.address.zip}`,
    COUNTRY_NAMES[request.address.country] || request.address.country,
  ].filter(Boolean);

const samplesTable = (items: SampleRequestItem[]) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
<tr style="background:#f5f1eb"><th align="left" style="padding:8px">SKU</th><th align="left" style="padding:8px">Fabric</th><th align="right" style="padding:8px">Qty</th></tr>
${items
  .map(
    (item) =>
      `<tr style="border-bottom:1px solid #eee"><td style="padding:8px;font-weight:bold">${escape(item.sku || '—')}</td><td style="padding:8px">${escape(
        item.name
      )}</td><td align="right" style="padding:8px">1 sample</td></tr>`
  )
  .join('')}
</table>`;

const textSamples = (items: SampleRequestItem[]) =>
  items.map((item) => `- SKU ${item.sku || '—'}${item.sku !== item.name ? ` (${item.name})` : ''}: 1 sample`).join('\n');

export const supplierSampleRequest = (request: SampleRequest, settings: EmailSettings): EmailContent => {
  const shipTo = addressLines(request);
  const contact = [request.phone ? `Phone: ${request.phone}` : '', `Email: ${request.email}`].filter(Boolean);
  const account = settings.supplierAccountNumber ? `Account #: ${settings.supplierAccountNumber}` : '';
  return {
    subject: `Sample Request ${request.requestNumber} — ${request.items.length} sample${request.items.length === 1 ? '' : 's'} to ${request.name}, ${request.address.city}`,
    html: layout(
      `Sample Request ${request.requestNumber}`,
      `${p(`Hello ${escape(settings.supplierName)} team, please send the following fabric samples directly to our customer.`)}
${account ? p(`<strong>${escape(account)}</strong>`) : ''}
${p(`<strong>Reference:</strong> ${escape(request.requestNumber)}`)}
${label('Ship to')}${block([...shipTo, ...contact])}
${label('Samples')}${samplesTable(request.items)}
${settings.supplierNotes ? `${label('Notes')}${p(escape(settings.supplierNotes))}` : ''}
${p(`Please reply with the carrier and tracking number once they ship, quoting ${escape(request.requestNumber)}.`)}
${p(`Thank you,<br>${escape(settings.fromName)}`)}`
    ),
    text: [
      `Sample Request ${request.requestNumber}`,
      account,
      '',
      'SHIP TO',
      ...shipTo,
      ...contact,
      '',
      'SAMPLES',
      textSamples(request.items),
      '',
      settings.supplierNotes ? `NOTES\n${settings.supplierNotes}\n` : '',
      `Please reply with the carrier and tracking number once they ship, quoting ${request.requestNumber}.`,
      '',
      `Thank you,\n${settings.fromName}`,
    ].join('\n'),
  };
};

export const customerSampleConfirmation = (request: SampleRequest, settings: EmailSettings): EmailContent => {
  const name = firstName(request.name);
  return {
    subject: `Your JL Comfort sample request ${request.requestNumber}`,
    html: layout(
      'Your samples are on the way',
      `${p(`Hi ${escape(name)}, thanks for requesting samples. We've received request <strong>${escape(request.requestNumber)}</strong>
and will email you a tracking number as soon as they ship.`)}
${label('Your samples')}${samplesTable(request.items)}
${label('Shipping to')}${block(addressLines(request))}
${p(`<br>Questions? Just reply to this email.`)}
${p(`— ${escape(settings.fromName)}`)}`
    ),
    text: [
      `Hi ${name},`,
      '',
      `Thanks for requesting samples. We've received request ${request.requestNumber} and will email you a tracking number as soon as they ship.`,
      '',
      'YOUR SAMPLES',
      textSamples(request.items),
      '',
      'SHIPPING TO',
      ...addressLines(request),
      '',
      'Questions? Just reply to this email.',
      `— ${settings.fromName}`,
    ].join('\n'),
  };
};

export const internalSampleNotification = (request: SampleRequest, adminUrl: string, supplierStatus: string): EmailContent => ({
  subject: `New sample request ${request.requestNumber} — ${request.items.length} sample${request.items.length === 1 ? '' : 's'} — ${request.name}`,
  html: layout(
    `New sample request ${request.requestNumber}`,
    `${p(`<strong>${escape(request.name)}</strong> (${escape(request.email)}${request.phone ? `, ${escape(request.phone)}` : ''}) requested ${request.items.length} sample${
      request.items.length === 1 ? '' : 's'
    }.`)}
${p(`<strong>Supplier:</strong> ${escape(supplierStatus)}`)}
${label('Samples')}${samplesTable(request.items)}
${label('Ship to')}${block(addressLines(request))}
${p(`<br><a href="${escape(adminUrl)}" style="color:#8d6c4b">Open the request in admin</a>`)}`
  ),
  text: [
    `New sample request ${request.requestNumber}`,
    `${request.name} (${request.email}${request.phone ? `, ${request.phone}` : ''})`,
    `Supplier: ${supplierStatus}`,
    '',
    textSamples(request.items),
    '',
    'SHIP TO',
    ...addressLines(request),
    '',
    `Admin: ${adminUrl}`,
  ].join('\n'),
});

export const customerSamplesShipped = (request: SampleRequest, settings: EmailSettings): EmailContent => {
  const name = firstName(request.name);
  return {
    subject: `Your JL Comfort samples ${request.requestNumber} have shipped`,
    html: layout(
      'Your samples have shipped',
      `${p(`Hi ${escape(name)}, your samples for request <strong>${escape(request.requestNumber)}</strong> are on their way.`)}
${p(`<strong>Carrier:</strong> ${escape(request.carrier)}<br><strong>Tracking number:</strong> ${escape(request.trackingNumber)}`)}
${trackButton(request.trackingUrl)}
${label('Shipping to')}${block(addressLines(request))}
${p(`<br>Questions? Just reply to this email.`)}
${p(`— ${escape(settings.fromName)}`)}`
    ),
    text: [
      `Hi ${name},`,
      '',
      `Your samples for request ${request.requestNumber} have shipped.`,
      `Carrier: ${request.carrier}`,
      `Tracking number: ${request.trackingNumber}`,
      request.trackingUrl ? `Track it: ${request.trackingUrl}` : '',
      '',
      'Questions? Just reply to this email.',
      `— ${settings.fromName}`,
    ].join('\n'),
  };
};
