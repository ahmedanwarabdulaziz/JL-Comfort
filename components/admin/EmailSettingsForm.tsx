'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { getEmailSettings, saveEmailSettings } from '@/lib/data/orders';
import { EmailSettings, VERIFIED_SENDING_DOMAINS } from '@/lib/types/order';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Form = Record<keyof EmailSettings, string>;

const toForm = (s: EmailSettings): Form => ({
  fromName: s.fromName,
  fromEmail: s.fromEmail,
  replyTo: s.replyTo || '',
  internalEmail: s.internalEmail || '',
  supplierName: s.supplierName,
  supplierEmail: s.supplierEmail || '',
  supplierSampleEmail: s.supplierSampleEmail || '',
  supplierAccountNumber: s.supplierAccountNumber || '',
  supplierNotes: s.supplierNotes || '',
});

const validate = (f: Form): string | null => {
  if (!f.fromName.trim()) return 'Enter a sender name.';
  if (!EMAIL_PATTERN.test(f.fromEmail.trim())) return 'The "from" address is not a valid email.';
  const domain = f.fromEmail.trim().split('@')[1].toLowerCase();
  if (!VERIFIED_SENDING_DOMAINS.includes(domain)) {
    return `The "from" address must end in @${VERIFIED_SENDING_DOMAINS.join(' or @')} (the domain verified in Resend).`;
  }
  for (const [label, value] of [['Reply-to', f.replyTo], ['Order copy', f.internalEmail], ['Supplier order', f.supplierEmail], ['Supplier sample', f.supplierSampleEmail]] as const) {
    if (value.trim() && !EMAIL_PATTERN.test(value.trim())) return `${label} address is not a valid email.`;
  }
  return null;
};

export default function EmailSettingsForm() {
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    getEmailSettings()
      .then((s) =>
        s
          ? setForm(toForm(s))
          : setMessage({ type: 'warning', text: 'No email settings found. Run supabase/migrations/20260925120000_orders_and_email.sql in the Supabase SQL editor.' })
      )
      .catch((err) => setMessage({ type: 'error', text: err.message || 'Failed to load email settings.' }));
  }, []);

  if (!form) {
    return message ? <Alert severity={message.type}>{message.text}</Alert> : <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  const field = (key: keyof EmailSettings, label: string, helperText?: string, multiline = false) => (
    <TextField
      label={label}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      helperText={helperText}
      fullWidth
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
    />
  );

  const handleSave = async () => {
    const problem = validate(form);
    if (problem) return setMessage({ type: 'error', text: problem });
    setSaving(true);
    setMessage(null);
    const clean = (v: string) => v.trim() || null;
    try {
      const saved = await saveEmailSettings({
        fromName: form.fromName.trim(),
        fromEmail: form.fromEmail.trim().toLowerCase(),
        replyTo: clean(form.replyTo),
        internalEmail: clean(form.internalEmail),
        supplierName: form.supplierName.trim() || 'Charlotte Fabrics',
        supplierEmail: clean(form.supplierEmail),
        supplierSampleEmail: clean(form.supplierSampleEmail),
        supplierAccountNumber: clean(form.supplierAccountNumber),
        supplierNotes: clean(form.supplierNotes),
      });
      setForm(toForm(saved));
      setMessage({ type: 'success', text: 'Email settings saved. They apply to the next email sent.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h5" gutterBottom>Email Settings</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Who order emails come from and where they go. Every paid order emails a purchase order to the supplier (fabric
        items only), a confirmation to the customer and a copy to you. Sample requests work the same way.
      </Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {!form.supplierEmail.trim() && (
        <Alert severity="warning" sx={{ mb: 2 }}>No supplier order email is set, so purchase orders will not be sent to Charlotte.</Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Sender</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {field('fromName', 'From name', 'Shown in the inbox, e.g. JL Comfort')}
          {field('fromEmail', 'From address', `Must end in @${VERIFIED_SENDING_DOMAINS[0]}. Does not need a mailbox.`)}
          {field('replyTo', 'Reply-to address', 'Where replies from customers and Charlotte go')}
          {field('internalEmail', 'Send a copy of every order to', 'Leave blank for no copy')}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Supplier purchase orders</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {field('supplierName', 'Supplier name')}
          {field('supplierEmail', 'Supplier order email', 'Purchase orders are sent here automatically')}
          {field('supplierSampleEmail', 'Supplier sample request email', 'Leave blank to send sample requests to the order email')}
          {field('supplierAccountNumber', 'Your account number with the supplier', 'Printed on every PO. Optional')}
        </Box>
        <Box sx={{ mt: 2 }}>{field('supplierNotes', 'Notes printed on every purchase order', 'e.g. blind ship instructions', true)}</Box>
      </Paper>

      <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={handleSave}>
        Save email settings
      </Button>
    </Box>
  );
}
