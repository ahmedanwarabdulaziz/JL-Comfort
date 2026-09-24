'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import {
  getSampleRequestWithHistory,
  getSampleRequests,
  getSampleSettings,
  runSampleRequestAction,
  saveSampleSettings,
} from '@/lib/data/sampleRequests';
import { CARRIERS } from '@/lib/types/order';
import { SAMPLE_STATUS_LABELS, SampleRequest, SampleRequestStatus, SampleSettings } from '@/lib/types/sampleRequest';

const FILTERS: Record<string, { label: string; statuses?: SampleRequestStatus[] }> = {
  open: { label: 'Open', statuses: ['pending', 'sent_to_supplier', 'shipped', 'problem'] },
  delivered: { label: 'Delivered', statuses: ['delivered'] },
  cancelled: { label: 'Cancelled', statuses: ['cancelled'] },
  all: { label: 'All' },
};

const STATUS_COLORS: Record<SampleRequestStatus, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  sent_to_supplier: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'default',
  problem: 'error',
};

const when = (d: Date | null) => (d ? d.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const cleanRef = (value: string) => value.trim().replace(/^#\s*/, '');

const StatusChip = ({ status }: { status: SampleRequestStatus }) => (
  <Chip size="small" label={SAMPLE_STATUS_LABELS[status]} color={STATUS_COLORS[status]} />
);

// --- limits ------------------------------------------------------------------------------

function SampleLimitsCard() {
  const [form, setForm] = useState<{ requestsEnabled: boolean; maxPerRequest: string; maxPerCustomer: string; periodDays: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getSampleSettings().then((s) =>
      setForm({
        requestsEnabled: s.requestsEnabled,
        maxPerRequest: String(s.maxPerRequest),
        maxPerCustomer: String(s.maxPerCustomer),
        periodDays: String(s.periodDays),
      })
    );
  }, []);

  if (!form) return null;

  const save = async () => {
    const settings: SampleSettings = {
      requestsEnabled: form.requestsEnabled,
      maxPerRequest: Number(form.maxPerRequest),
      maxPerCustomer: Number(form.maxPerCustomer),
      periodDays: Number(form.periodDays),
    };
    const whole = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
    if (!whole(settings.maxPerRequest, 1, 50)) return setMessage({ type: 'error', text: 'Samples per request must be a whole number from 1 to 50.' });
    if (!whole(settings.maxPerCustomer, 1, 500)) return setMessage({ type: 'error', text: 'Samples per customer must be a whole number from 1 to 500.' });
    if (!whole(settings.periodDays, 1, 3650)) return setMessage({ type: 'error', text: 'The period must be a whole number of days.' });
    if (settings.maxPerRequest > settings.maxPerCustomer) {
      return setMessage({ type: 'error', text: 'Samples per request cannot be more than samples per customer.' });
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveSampleSettings(settings);
      setMessage({ type: 'success', text: 'Sample limits saved. They apply to the next request.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const num = (key: 'maxPerRequest' | 'maxPerCustomer' | 'periodDays', labelText: string, unit: string) => (
    <TextField
      size="small"
      label={labelText}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      inputProps={{ inputMode: 'numeric' }}
      InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }}
    />
  );

  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>Sample limits</Typography>
        <FormControlLabel
          control={<Switch checked={form.requestsEnabled} onChange={(e) => setForm({ ...form, requestsEnabled: e.target.checked })} />}
          label={form.requestsEnabled ? 'Accepting sample requests' : 'Sample requests paused'}
        />
      </Box>
      {message && <Alert severity={message.type} sx={{ mb: 1.5 }} onClose={() => setMessage(null)}>{message.text}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr) auto' }, gap: 1.5, alignItems: 'center' }}>
        {num('maxPerRequest', 'Samples per request', 'max')}
        {num('maxPerCustomer', 'Samples per customer', 'max')}
        {num('periodDays', 'Within', 'days')}
        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={save}>
          Save
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        A customer is the same email address, or the same street address and postal code. Cancelled requests don&apos;t count.
      </Typography>
    </Paper>
  );
}

// --- detail ------------------------------------------------------------------------------

function ShipForm({ request, onDone }: { request: SampleRequest; onDone: (ok: boolean, text: string) => void }) {
  const [carrier, setCarrier] = useState('ups');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(request.supplierInvoiceNumber || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const { ok } = await runSampleRequestAction(request.id, {
        action: 'ship',
        carrier: carrier === 'other' ? 'Other' : carrier,
        trackingNumber,
        trackingUrl: carrier === 'other' ? trackingUrl : undefined,
        supplierInvoiceNumber: invoiceNumber,
      });
      onDone(ok, ok ? 'Marked shipped and the customer was emailed their tracking number.' : 'Marked shipped, but the email to the customer failed. See the history below.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom>Add tracking (from Charlotte&apos;s shipped email)</Typography>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 1.5 }}>
        <FormControl size="small">
          <InputLabel id="sample-carrier-label">Carrier</InputLabel>
          <Select labelId="sample-carrier-label" label="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            <MenuItem value="other">Other…</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" label="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
        <TextField
          size="small"
          label="Charlotte invoice # (optional, from the shipped email)"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          sx={{ gridColumn: { sm: 'span 2' } }}
        />
        {carrier === 'other' && (
          <TextField size="small" label="Tracking link (https://…)" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} sx={{ gridColumn: { sm: 'span 2' } }} />
        )}
      </Box>
      <Button variant="contained" sx={{ mt: 1.5 }} disabled={busy || !trackingNumber.trim()} onClick={submit}>
        {busy ? 'Saving…' : 'Mark shipped & email customer'}
      </Button>
    </Box>
  );
}

function RequestDetail({ requestId, onClose, onChanged }: { requestId: string; onClose: () => void; onChanged: () => void }) {
  const [request, setRequest] = useState<SampleRequest | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [refs, setRefs] = useState({ orderNumber: '', invoiceNumber: '' });

  const reload = useCallback(async () => {
    const fresh = await getSampleRequestWithHistory(requestId);
    setRequest(fresh);
    if (fresh) setRefs({ orderNumber: fresh.supplierOrderNumber || '', invoiceNumber: fresh.supplierInvoiceNumber || '' });
  }, [requestId]);

  useEffect(() => {
    reload().catch((err) => setMessage({ ok: false, text: err.message }));
  }, [reload]);

  const act = async (body: Record<string, unknown>, success: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const { ok } = await runSampleRequestAction(requestId, body);
      await reload();
      setMessage(ok ? { ok: true, text: success } : { ok: false, text: 'That did not go through. See the history below for the reason.' });
      onChanged();
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const refsChanged =
    request && (cleanRef(refs.orderNumber) !== (request.supplierOrderNumber || '') || cleanRef(refs.invoiceNumber) !== (request.supplierInvoiceNumber || ''));

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 6, flexWrap: 'wrap' }}>
        {request ? `Sample request ${request.requestNumber}` : 'Sample request'} {request && <StatusChip status={request.status} />}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!request ? (
          message ? <Alert severity="error">{message.text}</Alert> : <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            {message && <Alert severity={message.ok ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Customer</Typography>
                <Typography>{request.name}</Typography>
                <Typography variant="body2">{request.email}</Typography>
                {request.phone && <Typography variant="body2">{request.phone}</Typography>}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Requested {when(request.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Ship to</Typography>
                <Typography variant="body2">
                  {request.name}<br />
                  {request.address.line1}{request.address.line2 ? <><br />{request.address.line2}</> : null}<br />
                  {request.address.city} {request.address.state} {request.address.zip}<br />
                  {request.address.country}
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>SKU</TableCell><TableCell>Fabric</TableCell></TableRow></TableHead>
                <TableBody>
                  {request.items.map((item) => (
                    <TableRow key={item.fabricId || item.sku}><TableCell><strong>{item.sku}</strong></TableCell><TableCell>{item.name}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Charlotte references</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start', mb: 3 }}>
              <TextField size="small" label="Order ref #" value={refs.orderNumber} onChange={(e) => setRefs({ ...refs, orderNumber: e.target.value })} helperText="From Charlotte's receipt" />
              <TextField size="small" label="Invoice #" value={refs.invoiceNumber} onChange={(e) => setRefs({ ...refs, invoiceNumber: e.target.value })} helperText="From Charlotte's shipped email" />
              <Button
                size="small"
                variant="outlined"
                sx={{ mt: 0.5 }}
                disabled={busy || !refsChanged}
                onClick={() => act({ action: 'set_supplier_refs', supplierOrderNumber: cleanRef(refs.orderNumber), supplierInvoiceNumber: cleanRef(refs.invoiceNumber) }, 'Charlotte references saved.')}
              >
                Save
              </Button>
            </Box>

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Shipping</Typography>
            {request.trackingNumber ? (
              <Typography variant="body2" sx={{ mb: 2 }}>
                {request.carrier} · {request.trackingUrl ? <a href={request.trackingUrl} target="_blank" rel="noreferrer">{request.trackingNumber}</a> : request.trackingNumber} · shipped {when(request.shippedAt)}
              </Typography>
            ) : !request.supplierEmailedAt ? (
              <Alert severity="warning" sx={{ mb: 2 }}>This request has not been sent to Charlotte yet. Check the history below, then use &quot;Send to Charlotte&quot;.</Alert>
            ) : null}
            {!request.trackingNumber && ['pending', 'sent_to_supplier', 'problem'].includes(request.status) && (
              <ShipForm request={request} onDone={async (ok, text) => { await reload(); setMessage({ ok, text }); onChanged(); }} />
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, alignItems: 'center' }}>
              <Button size="small" variant="outlined" disabled={busy} onClick={() => act({ action: 'resend_supplier' }, 'Sample request emailed to Charlotte.')}>
                {request.supplierEmailedAt ? 'Resend to Charlotte' : 'Send to Charlotte'}
              </Button>
              <Button size="small" variant="outlined" disabled={busy} onClick={() => act({ action: 'resend_confirmation' }, 'Confirmation re-sent to the customer.')}>
                Resend confirmation
              </Button>
              {request.trackingNumber && (
                <Button size="small" variant="outlined" disabled={busy} onClick={() => act({ action: 'resend_shipped' }, 'Shipping email re-sent to the customer.')}>
                  Resend shipped email
                </Button>
              )}
              <Box sx={{ flexGrow: 1 }} />
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel id="sample-status-label">Change status</InputLabel>
                <Select
                  labelId="sample-status-label"
                  label="Change status"
                  value=""
                  disabled={busy}
                  onChange={(e) => {
                    const status = e.target.value as SampleRequestStatus;
                    if (window.confirm(`Change ${request.requestNumber} to "${SAMPLE_STATUS_LABELS[status]}"? No email is sent for this.`)) {
                      act({ action: 'set_status', status }, `Status changed to ${SAMPLE_STATUS_LABELS[status]}.`);
                    }
                  }}
                >
                  {(['delivered', 'problem', 'cancelled', 'sent_to_supplier', 'pending'] as SampleRequestStatus[])
                    .filter((s) => s !== request.status)
                    .map((s) => <MenuItem key={s} value={s}>{SAMPLE_STATUS_LABELS[s]}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>History</Typography>
            {request.events.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Nothing yet.</Typography>
            ) : (
              request.events.map((event) => (
                <Box key={event.id} sx={{ display: 'flex', gap: 2, py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 150, pt: 0.2 }}>{when(event.createdAt)}</Typography>
                  <Typography variant="body2" color={event.type === 'email_failed' ? 'error' : 'text.primary'}>{event.message}</Typography>
                </Box>
              ))
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- list --------------------------------------------------------------------------------

export default function SampleRequestsList() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('open');
  const [requests, setRequests] = useState<SampleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(searchParams?.get('request') || null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await getSampleRequests(FILTERS[filter].statuses));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load sample requests.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const term = search.trim().toLowerCase().replace(/^#\s*/, '');
  const visible = term
    ? requests.filter((r) =>
        [r.requestNumber, r.supplierOrderNumber, r.supplierInvoiceNumber, r.name, r.email, r.trackingNumber, r.address.city, ...r.items.map((i) => i.sku)]
          .some((field) => (field || '').toLowerCase().includes(term))
      )
    : requests;

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Fabric Sample Requests</Typography>
        <Button startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Box>

      <SampleLimitsCard />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, value) => value && setFilter(value)}>
          {Object.entries(FILTERS).map(([key, f]) => <ToggleButton key={key} value={key}>{f.label}</ToggleButton>)}
        </ToggleButtonGroup>
        <TextField
          size="small"
          placeholder="Search S-#, Charlotte #, customer, SKU, tracking…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300, flexGrow: 1, maxWidth: 420 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : visible.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{term ? `No requests match "${search.trim()}" in this view. Try the "All" filter.` : 'No sample requests here yet.'}</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Charlotte</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Ship to</TableCell>
                <TableCell>Samples</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => setOpenId(r.id)}>
                  <TableCell><strong>{r.requestNumber}</strong></TableCell>
                  <TableCell>
                    {r.supplierOrderNumber || r.supplierInvoiceNumber ? (
                      <>
                        {r.supplierOrderNumber && <div>Order #{r.supplierOrderNumber}</div>}
                        {r.supplierInvoiceNumber && <Typography variant="caption" color="text.secondary">Inv #{r.supplierInvoiceNumber}</Typography>}
                      </>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>{r.createdAt.toLocaleDateString('en-CA', { dateStyle: 'medium' })}</TableCell>
                  <TableCell>{r.name}<br /><Typography variant="caption" color="text.secondary">{r.email}</Typography></TableCell>
                  <TableCell>{r.address.city}, {r.address.state}</TableCell>
                  <TableCell>{r.items.length}</TableCell>
                  <TableCell><StatusChip status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {openId && <RequestDetail requestId={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </Box>
  );
}
