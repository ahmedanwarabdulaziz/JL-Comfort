import { EmailSettings, Order, OrderItem } from '@/lib/types/order';

// Order email content. Each builder returns a subject plus matching HTML and plain-text bodies
// (the text part helps deliverability and is what some mail clients show in previews).

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const COUNTRY_NAMES: Record<string, string> = { CA: 'Canada', US: 'United States' };

const escape = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (cents: number, currency = 'cad') => `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;

const addressLines = (order: Order): string[] =>
  [
    order.customerName,
    order.shipLine1,
    order.shipLine2 || '',
    `${order.shipCity} ${order.shipRegion} ${order.shipPostalCode}`,
    COUNTRY_NAMES[order.shipCountry] || order.shipCountry,
  ].filter(Boolean);

const yards = (item: OrderItem) => `${item.quantity} yard${item.quantity === 1 ? '' : 's'}`;

export const supplierItems = (order: Order) => order.items.filter((item) => item.fulfilledBy === 'supplier');

// --- shared layout -------------------------------------------------------------------------

const layout = (title: string, body: string) => `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f1eb;font-family:Arial,Helvetica,sans-serif;color:#252321">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1eb;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e1dc">
<tr><td style="padding:22px 28px;border-bottom:1px solid #e5e1dc;font-size:18px;letter-spacing:2px;font-weight:bold">JL COMFORT</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:21px;font-weight:normal">${escape(title)}</h1>
${body}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const p = (text: string) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4a4540">${text}</p>`;
const label = (text: string) =>
  `<div style="margin:22px 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#8d6c4b">${escape(text)}</div>`;
const block = (lines: string[]) =>
  `<div style="font-size:14px;line-height:1.6;color:#252321">${lines.map(escape).join('<br>')}</div>`;

const itemsTable = (items: OrderItem[], withPrices: boolean, currency: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
<tr style="background:#f5f1eb">
  ${withPrices ? '' : '<th align="left" style="padding:8px">SKU</th>'}
  <th align="left" style="padding:8px">Item</th>
  <th align="right" style="padding:8px">Qty</th>
  ${withPrices ? '<th align="right" style="padding:8px">Amount</th>' : ''}
</tr>
${items
  .map(
    (item) => `<tr style="border-bottom:1px solid #eee">
  ${withPrices ? '' : `<td style="padding:8px;font-weight:bold">${escape(item.sku || '—')}</td>`}
  <td style="padding:8px">${escape(item.name)}${
      // On the PO, SKU and yards have their own columns; the description would only repeat them.
      withPrices && item.description ? `<br><span style="color:#8b857e;font-size:12px">${escape(item.description)}</span>` : ''
    }</td>
  <td align="right" style="padding:8px;white-space:nowrap">${
    item.itemType === 'fabric' || item.itemType === 'vinyl' ? yards(item) : item.quantity
  }</td>
  ${withPrices ? `<td align="right" style="padding:8px;white-space:nowrap">${money(item.amountCents, currency)}</td>` : ''}
</tr>`
  )
  .join('')}
</table>`;

const totalsTable = (order: Order) => {
  const row = (name: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 8px;${bold ? 'font-weight:bold;' : 'color:#77716b;'}">${escape(name)}</td><td align="right" style="padding:4px 8px;${
      bold ? 'font-weight:bold;' : ''
    }">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:10px">
${row('Subtotal', money(order.subtotalCents, order.currency))}
${row('Shipping', order.shippingCents === 0 ? 'Free' : money(order.shippingCents, order.currency))}
${order.taxes.map((tax) => row(tax.label, money(tax.amountCents, order.currency))).join('')}
${row('Total', money(order.totalCents, order.currency), true)}
</table>`;
};

const textItems = (items: OrderItem[], withPrices: boolean, currency: string) =>
  items
    .map((item) => {
      const qty = item.itemType === 'fabric' || item.itemType === 'vinyl' ? yards(item) : `x${item.quantity}`;
      if (!withPrices) return `- SKU ${item.sku || '—'}${item.sku !== item.name ? ` (${item.name})` : ''}: ${qty}`;
      return `- ${item.name} (${qty})  ${money(item.amountCents, currency)}${item.description ? `\n  ${item.description}` : ''}`;
    })
    .join('\n');

const textTotals = (order: Order) =>
  [
    `Subtotal: ${money(order.subtotalCents, order.currency)}`,
    `Shipping: ${order.shippingCents === 0 ? 'Free' : money(order.shippingCents, order.currency)}`,
    ...order.taxes.map((tax) => `${tax.label}: ${money(tax.amountCents, order.currency)}`),
    `Total: ${money(order.totalCents, order.currency)}`,
  ].join('\n');

// --- emails --------------------------------------------------------------------------------

/** Drop-ship purchase order to the fabric supplier. No retail prices: the customer's price is ours. */
export const supplierPurchaseOrder = (order: Order, settings: EmailSettings): EmailContent => {
  const items = supplierItems(order);
  const shipTo = addressLines(order);
  const contact = [order.customerPhone ? `Phone: ${order.customerPhone}` : '', `Email: ${order.customerEmail}`].filter(Boolean);
  const account = settings.supplierAccountNumber ? `Account #: ${settings.supplierAccountNumber}` : '';

  return {
    subject: `Purchase Order ${order.orderNumber} — Drop ship to ${order.customerName}, ${order.shipCity} ${order.shipRegion}`,
    html: layout(
      `Purchase Order ${order.orderNumber}`,
      `${p(`Hello ${escape(settings.supplierName)} team, please prepare and ship the following order directly to our customer.`)}
${account ? p(`<strong>${escape(account)}</strong>`) : ''}
${p(`<strong>PO number:</strong> ${escape(order.orderNumber)}`)}
${label('Ship to')}${block([...shipTo, ...contact])}
${label('Items')}${itemsTable(items, false, order.currency)}
${settings.supplierNotes ? `${label('Notes')}${p(escape(settings.supplierNotes))}` : ''}
${p(`Please reply to this email with the carrier and tracking number once it ships, quoting PO ${escape(order.orderNumber)}.`)}
${p(`Thank you,<br>${escape(settings.fromName)}`)}`
    ),
    text: [
      `Purchase Order ${order.orderNumber}`,
      account,
      '',
      'SHIP TO',
      ...shipTo,
      ...contact,
      '',
      'ITEMS',
      textItems(items, false, order.currency),
      '',
      settings.supplierNotes ? `NOTES\n${settings.supplierNotes}\n` : '',
      `Please reply with the carrier and tracking number once it ships, quoting PO ${order.orderNumber}.`,
      '',
      `Thank you,\n${settings.fromName}`,
    ]
      .filter((line) => line !== null)
      .join('\n'),
  };
};

export const customerConfirmation = (order: Order, settings: EmailSettings): EmailContent => {
  const firstName = order.customerName.split(' ')[0] || order.customerName;
  return {
    subject: `Your JL Comfort order ${order.orderNumber} is confirmed`,
    html: layout(
      'Thank you for your order',
      `${p(`Hi ${escape(firstName)}, we've received your order <strong>${escape(order.orderNumber)}</strong> and it's being prepared.
We'll email you a tracking number as soon as it ships.`)}
${label('Your order')}${itemsTable(order.items, true, order.currency)}${totalsTable(order)}
${label('Shipping to')}${block(addressLines(order))}
${p(`<br>Questions? Just reply to this email.`)}
${p(`— ${escape(settings.fromName)}`)}`
    ),
    text: [
      `Hi ${firstName},`,
      '',
      `Thank you for your order ${order.orderNumber}. We'll email you a tracking number as soon as it ships.`,
      '',
      'YOUR ORDER',
      textItems(order.items, true, order.currency),
      '',
      textTotals(order),
      '',
      'SHIPPING TO',
      ...addressLines(order),
      '',
      'Questions? Just reply to this email.',
      `— ${settings.fromName}`,
    ].join('\n'),
  };
};

export const internalNotification = (order: Order, adminUrl: string, supplierStatus: string): EmailContent => ({
  subject: `New order ${order.orderNumber} — ${money(order.totalCents, order.currency)} — ${order.customerName}`,
  html: layout(
    `New order ${order.orderNumber}`,
    `${p(`<strong>${escape(order.customerName)}</strong> (${escape(order.customerEmail)}${order.customerPhone ? `, ${escape(order.customerPhone)}` : ''}) paid ${money(order.totalCents, order.currency)}.`)}
${p(`<strong>Supplier:</strong> ${escape(supplierStatus)}`)}
${label('Items')}${itemsTable(order.items, true, order.currency)}${totalsTable(order)}
${label('Ship to')}${block(addressLines(order))}
${p(`<br><a href="${escape(adminUrl)}" style="color:#8d6c4b">Open the order in admin</a>`)}`
  ),
  text: [
    `New order ${order.orderNumber}`,
    `${order.customerName} (${order.customerEmail}${order.customerPhone ? `, ${order.customerPhone}` : ''}) paid ${money(order.totalCents, order.currency)}.`,
    `Supplier: ${supplierStatus}`,
    '',
    textItems(order.items, true, order.currency),
    '',
    textTotals(order),
    '',
    'SHIP TO',
    ...addressLines(order),
    '',
    `Admin: ${adminUrl}`,
  ].join('\n'),
});

export const customerShipped = (order: Order, carrierName: string, settings: EmailSettings): EmailContent => {
  const firstName = order.customerName.split(' ')[0] || order.customerName;
  const link = order.trackingUrl
    ? `<a href="${escape(order.trackingUrl)}" style="display:inline-block;margin:6px 0 18px;padding:12px 22px;background:#252321;color:#ffffff;text-decoration:none;font-size:14px">Track your package</a>`
    : '';
  return {
    subject: `Your JL Comfort order ${order.orderNumber} has shipped`,
    html: layout(
      'Your order is on its way',
      `${p(`Hi ${escape(firstName)}, good news: your order <strong>${escape(order.orderNumber)}</strong> has shipped.`)}
${p(`<strong>Carrier:</strong> ${escape(carrierName)}<br><strong>Tracking number:</strong> ${escape(order.trackingNumber)}`)}
${link}
${label('Shipping to')}${block(addressLines(order))}
${p(`<br>Questions? Just reply to this email.`)}
${p(`— ${escape(settings.fromName)}`)}`
    ),
    text: [
      `Hi ${firstName},`,
      '',
      `Your order ${order.orderNumber} has shipped.`,
      `Carrier: ${carrierName}`,
      `Tracking number: ${order.trackingNumber}`,
      order.trackingUrl ? `Track it: ${order.trackingUrl}` : '',
      '',
      'Questions? Just reply to this email.',
      `— ${settings.fromName}`,
    ].join('\n'),
  };
};
