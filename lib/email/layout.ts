// Building blocks shared by every transactional email (orders and sample requests).

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export const COUNTRY_NAMES: Record<string, string> = { CA: 'Canada', US: 'United States' };

export const escape = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const layout = (title: string, body: string) => `<!doctype html>
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

export const p = (text: string) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4a4540">${text}</p>`;

export const label = (text: string) =>
  `<div style="margin:22px 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#8d6c4b">${escape(text)}</div>`;

export const block = (lines: string[]) =>
  `<div style="font-size:14px;line-height:1.6;color:#252321">${lines.map(escape).join('<br>')}</div>`;

export const trackButton = (url: string | null) =>
  url
    ? `<a href="${escape(url)}" style="display:inline-block;margin:6px 0 18px;padding:12px 22px;background:#252321;color:#ffffff;text-decoration:none;font-size:14px">Track your package</a>`
    : '';

export const firstName = (fullName: string) => fullName.split(' ')[0] || fullName;
