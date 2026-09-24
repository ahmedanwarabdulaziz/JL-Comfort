'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CasinoIcon from '@mui/icons-material/Casino';
import DownloadIcon from '@mui/icons-material/Download';
import {
  DiscountInput,
  DiscountSummary,
  Redemption,
  addCode,
  deleteCode,
  deleteDiscount,
  generateCodes,
  getCodeUses,
  getDiscounts,
  getRedemptions,
  getSampleBookNames,
  randomCode,
  saveDiscount,
} from '@/lib/data/discounts';
import {
  APPLIES_TO_LABELS,
  DiscountAppliesTo,
  DiscountMethod,
  DiscountStatus,
  DiscountType,
  describeDiscount,
  discountStatus,
  normalizeCode,
} from '@/lib/types/discount';

const STATUS_CHIP: Record<DiscountStatus, { label: string; color: 'success' | 'info' | 'default' | 'warning' }> = {
  active: { label: 'Active', color: 'success' },
  scheduled: { label: 'Scheduled', color: 'info' },
  expired: { label: 'Expired', color: 'default' },
  disabled: { label: 'Disabled', color: 'warning' },
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const when = (d: Date) => d.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

// ─── Editor form state ───────────────────────────────────────────────────────
interface FormState {
  title: string;
  method: DiscountMethod;
  code: string;
  type: DiscountType;
  value: string;
  appliesTo: DiscountAppliesTo;
  appliesToBooks: string[];
  minimum: 'none' | 'subtotal' | 'yards';
  minValue: string;
  limitTotal: boolean;
  usageLimit: string;
  oncePerCustomer: boolean;
  startsAt: string;
  hasEnd: boolean;
  endsAt: string;
  enabled: boolean;
}

const newForm = (): FormState => ({
  title: '',
  method: 'code',
  code: randomCode(8),
  type: 'percentage',
  value: '10',
  appliesTo: 'all',
  appliesToBooks: [],
  minimum: 'none',
  minValue: '',
  limitTotal: false,
  usageLimit: '',
  oncePerCustomer: false,
  startsAt: toLocalInput(new Date()),
  hasEnd: false,
  endsAt: '',
  enabled: true,
});

const fromDiscount = (d: DiscountSummary): FormState => ({
  title: d.title,
  method: d.method,
  code: d.codes[0]?.code || '',
  type: d.type,
  value: String(d.value),
  appliesTo: d.appliesTo,
  appliesToBooks: d.appliesToBooks,
  minimum: d.minSubtotal != null ? 'subtotal' : d.minYards != null ? 'yards' : 'none',
  minValue: d.minSubtotal != null ? String(d.minSubtotal) : d.minYards != null ? String(d.minYards) : '',
  limitTotal: d.usageLimit != null,
  usageLimit: d.usageLimit != null ? String(d.usageLimit) : '',
  oncePerCustomer: d.oncePerCustomer,
  startsAt: toLocalInput(d.startsAt),
  hasEnd: !!d.endsAt,
  endsAt: d.endsAt ? toLocalInput(d.endsAt) : '',
  enabled: d.enabled,
});

const toInput = (f: FormState): DiscountInput | string => {
  if (!f.title.trim()) return 'Give the discount a title.';
  const value = Number(f.value);
  if (f.type !== 'free_shipping') {
    if (!f.value.trim() || !Number.isFinite(value) || value <= 0) return 'Enter the discount value.';
    if (f.type === 'percentage' && value > 100) return 'A percentage can be at most 100.';
  }
  if (f.appliesTo === 'sample_books' && f.appliesToBooks.length === 0) return 'Choose at least one collection.';
  const minValue = Number(f.minValue);
  if (f.minimum !== 'none' && (!f.minValue.trim() || !Number.isFinite(minValue) || minValue <= 0)) return 'Enter the minimum.';
  if (f.minimum === 'yards' && !Number.isInteger(minValue)) return 'Minimum yards must be a whole number.';
  const usageLimit = Number(f.usageLimit);
  if (f.limitTotal && (!Number.isInteger(usageLimit) || usageLimit < 1)) return 'The usage limit must be a whole number, 1 or more.';
  const startsAt = new Date(f.startsAt);
  if (Number.isNaN(startsAt.getTime())) return 'Choose a start date.';
  const endsAt = f.hasEnd ? new Date(f.endsAt) : null;
  if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) return 'The end date must be after the start date.';

  return {
    title: f.title.trim(),
    method: f.method,
    type: f.type,
    value: f.type === 'free_shipping' ? 0 : Math.round(value * 100) / 100,
    appliesTo: f.appliesTo,
    appliesToBooks: f.appliesToBooks,
    minSubtotal: f.minimum === 'subtotal' ? minValue : null,
    minYards: f.minimum === 'yards' ? minValue : null,
    usageLimit: f.limitTotal ? usageLimit : null,
    oncePerCustomer: f.oncePerCustomer,
    startsAt,
    endsAt,
    enabled: f.enabled,
  };
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{title}</Typography>
      {children}
    </Paper>
  );
}

// ─── Codes panel (existing code discounts) ──────────────────────────────────
function CodesPanel({ discount, onChanged }: { discount: DiscountSummary; onChanged: () => void }) {
  const [uses, setUses] = useState<Record<string, number>>({});
  const [newCode, setNewCode] = useState('');
  const [prefix, setPrefix] = useState('');
  const [count, setCount] = useState('50');
  const [singleUse, setSingleUse] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getCodeUses(discount.id).then(setUses).catch(() => {});
  }, [discount.id, discount.codeCount]);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage({ ok: true, text: await fn() });
      onChanged();
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const rows = [['code', 'uses', 'limit'], ...discount.codes.map((c) => [c.code, String(uses[c.id] || 0), c.usageLimit == null ? '' : String(c.usageLimit)])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${discount.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'discount'}-codes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section title={`Codes (${discount.codeCount})`}>
      {message && <Alert severity={message.ok ? 'success' : 'error'} sx={{ mb: 1.5 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" label="Add a code" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} sx={{ flex: 1, minWidth: 180 }} />
        <Button variant="outlined" disabled={busy || !newCode.trim()} onClick={() => run(async () => { await addCode(discount.id, newCode, null); setNewCode(''); return `Code ${normalizeCode(newCode)} added.`; })}>
          Add
        </Button>
      </Box>

      <Box sx={{ p: 1.5, bgcolor: 'action.hover', mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Bulk generate unique codes</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField size="small" label="Starts with (prefix)" placeholder="WELCOME" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} sx={{ width: 180 }} />
          <TextField size="small" label="How many" value={count} onChange={(e) => setCount(e.target.value)} inputProps={{ inputMode: 'numeric' }} sx={{ width: 110 }} />
          <FormControlLabel control={<Checkbox checked={singleUse} onChange={(e) => setSingleUse(e.target.checked)} />} label="Each code can be used once" />
          <Button
            variant="contained"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const created = await generateCodes(discount.id, prefix, Number(count), singleUse ? 1 : null);
                return `Generated ${created.length} code${created.length === 1 ? '' : 's'}, e.g. ${created[0] || ''}.`;
              })
            }
          >
            Generate
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Codes look like {(normalizeCode(prefix) || 'PREFIX').replace(/-+$/, '')}-7K3F9Q2M. Handy for newsletters, events or partners.
        </Typography>
      </Box>

      {discount.codes.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button size="small" startIcon={<DownloadIcon />} onClick={exportCsv}>Export CSV</Button>
          </Box>
          <TableContainer sx={{ maxHeight: 280 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow><TableCell>Code</TableCell><TableCell align="right">Used</TableCell><TableCell align="right">Limit</TableCell><TableCell /></TableRow>
              </TableHead>
              <TableBody>
                {discount.codes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{c.code}</TableCell>
                    <TableCell align="right">{uses[c.id] || 0}</TableCell>
                    <TableCell align="right">{c.usageLimit ?? '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete code">
                        <span>
                          <IconButton size="small" disabled={busy || discount.codeCount <= 1} onClick={() => window.confirm(`Delete code ${c.code}?`) && run(async () => { await deleteCode(c.id); return `Code ${c.code} deleted.`; })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Section>
  );
}

function RedemptionsPanel({ discountId }: { discountId: string }) {
  const [rows, setRows] = useState<Redemption[] | null>(null);
  useEffect(() => {
    getRedemptions(discountId).then(setRows).catch(() => setRows([]));
  }, [discountId]);
  if (!rows) return null;
  return (
    <Section title={`Used on ${rows.length} order${rows.length === 1 ? '' : 's'}`}>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Not used yet. A use counts once the order is paid.</Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 260 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Code</TableCell><TableCell align="right">Saved</TableCell><TableCell>Date</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><a href={`/admin/orders?order=${r.orderId}`}>{r.orderNumber || 'Order'}</a></TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.code || '—'}</TableCell>
                  <TableCell align="right">{money(r.amountCents)}</TableCell>
                  <TableCell>{when(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Section>
  );
}

// ─── Editor dialog ───────────────────────────────────────────────────────────
function DiscountEditor({
  discount,
  onClose,
  onSaved,
  onChanged,
}: {
  discount: DiscountSummary | null;
  onClose: () => void;
  onSaved: () => void; // saved or deleted: reload and close
  onChanged: () => void; // codes added/removed: reload, stay open
}) {
  const [form, setForm] = useState<FormState>(discount ? fromDiscount(discount) : newForm());
  const [books, setBooks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (form.appliesTo === 'sample_books' && books.length === 0) getSampleBookNames().then(setBooks).catch(() => {});
  }, [form.appliesTo, books.length]);

  const parsed = toInput(form);
  const preview = typeof parsed === 'string' ? null : describeDiscount(parsed);

  const save = async () => {
    if (typeof parsed === 'string') return setError(parsed);
    if (!discount && form.method === 'code' && !/^[A-Z0-9_-]{3,40}$/.test(normalizeCode(form.code))) {
      return setError('The code must be 3 to 40 letters, numbers, dashes or underscores.');
    }
    setSaving(true);
    setError('');
    try {
      await saveDiscount(discount?.id || null, parsed, form.method === 'code' ? form.code : undefined);
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Could not save the discount.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!discount) return;
    const note = discount.uses > 0 ? ` It was used on ${discount.uses} order(s); those orders keep their discount, but its history here is removed. To stop it without losing history, switch it off instead.` : '';
    if (!window.confirm(`Delete "${discount.title}"?${note}`)) return;
    try {
      await deleteDiscount(discount.id);
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Could not delete.');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{discount ? `Edit discount: ${discount.title}` : 'Create discount'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Section title="Method">
          <RadioGroup row value={form.method} onChange={(e) => set('method', e.target.value as DiscountMethod)}>
            <FormControlLabel value="code" control={<Radio />} label="Discount code" disabled={!!discount} />
            <FormControlLabel value="automatic" control={<Radio />} label="Automatic discount" disabled={!!discount} />
          </RadioGroup>
          <TextField
            fullWidth
            size="small"
            label="Title"
            helperText={form.method === 'code' ? 'For your reference, e.g. "Spring newsletter".' : 'Customers see this at checkout, e.g. "Spring sale".'}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            sx={{ mt: 1.5 }}
          />
          {form.method === 'code' && !discount && (
            <TextField
              fullWidth
              size="small"
              label="Discount code"
              helperText="Customers enter this at checkout. More codes, including bulk single-use codes, can be added after saving."
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              sx={{ mt: 1.5 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Generate a random code">
                      <IconButton size="small" onClick={() => set('code', randomCode(8))}><CasinoIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Section>

        <Section title="Value">
          <RadioGroup row value={form.type} onChange={(e) => set('type', e.target.value as DiscountType)}>
            <FormControlLabel value="percentage" control={<Radio />} label="Percentage" />
            <FormControlLabel value="fixed_amount" control={<Radio />} label="Fixed amount" />
            <FormControlLabel value="free_shipping" control={<Radio />} label="Free shipping" />
          </RadioGroup>
          {form.type !== 'free_shipping' && (
            <TextField
              size="small"
              label={form.type === 'percentage' ? 'Percentage off' : 'Amount off'}
              value={form.value}
              onChange={(e) => set('value', e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              InputProps={form.type === 'percentage' ? { endAdornment: <InputAdornment position="end">%</InputAdornment> } : { startAdornment: <InputAdornment position="start">$</InputAdornment>, endAdornment: <InputAdornment position="end">CAD</InputAdornment> }}
              sx={{ mt: 1, width: 220 }}
            />
          )}
          <TextField select size="small" label="Applies to" value={form.appliesTo} onChange={(e) => set('appliesTo', e.target.value as DiscountAppliesTo)} sx={{ mt: 2, ml: form.type === 'free_shipping' ? 0 : 2, width: 240 }}>
            {(Object.keys(APPLIES_TO_LABELS) as DiscountAppliesTo[]).map((key) => (
              <MenuItem key={key} value={key}>{APPLIES_TO_LABELS[key]}</MenuItem>
            ))}
          </TextField>
          {form.appliesTo === 'sample_books' && (
            <Autocomplete
              multiple
              options={books}
              loading={books.length === 0}
              value={form.appliesToBooks}
              onChange={(_, value) => set('appliesToBooks', value)}
              renderInput={(params) => <TextField {...params} size="small" label="Collections (sample books)" helperText="Fabric from any of these collections gets the discount." />}
              sx={{ mt: 2 }}
            />
          )}
        </Section>

        <Section title="Minimum requirement">
          <RadioGroup value={form.minimum} onChange={(e) => set('minimum', e.target.value as FormState['minimum'])}>
            <FormControlLabel value="none" control={<Radio />} label="No minimum" />
            <FormControlLabel value="subtotal" control={<Radio />} label="Minimum purchase amount (CAD)" />
            <FormControlLabel value="yards" control={<Radio />} label="Minimum yards of fabric" />
          </RadioGroup>
          {form.minimum !== 'none' && (
            <TextField
              size="small"
              label={form.minimum === 'subtotal' ? 'Minimum amount' : 'Minimum yards'}
              value={form.minValue}
              onChange={(e) => set('minValue', e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              InputProps={form.minimum === 'subtotal' ? { startAdornment: <InputAdornment position="start">$</InputAdornment> } : { endAdornment: <InputAdornment position="end">yd</InputAdornment> }}
              sx={{ mt: 1, width: 220 }}
            />
          )}
        </Section>

        <Section title="Usage limits">
          <FormControlLabel control={<Checkbox checked={form.limitTotal} onChange={(e) => set('limitTotal', e.target.checked)} />} label="Limit the total number of times this discount can be used" />
          {form.limitTotal && (
            <TextField size="small" label="Total uses" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} inputProps={{ inputMode: 'numeric' }} sx={{ display: 'block', ml: 4, mb: 1, width: 160 }} />
          )}
          <FormControlLabel control={<Checkbox checked={form.oncePerCustomer} onChange={(e) => set('oncePerCustomer', e.target.checked)} />} label="Limit to one use per customer (by email)" />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            One-time codes: use &quot;Bulk generate&quot; after saving, or set total uses to 1.
          </Typography>
        </Section>

        <Section title="Active dates">
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" type="datetime-local" label="Start" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} InputLabelProps={{ shrink: true }} />
            <FormControlLabel control={<Checkbox checked={form.hasEnd} onChange={(e) => set('hasEnd', e.target.checked)} />} label="Set end date" />
            {form.hasEnd && <TextField size="small" type="datetime-local" label="End" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} InputLabelProps={{ shrink: true }} />}
          </Box>
          <FormControlLabel sx={{ mt: 1.5 }} control={<Switch checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />} label={form.enabled ? 'Enabled' : 'Switched off'} />
        </Section>

        {preview && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Summary: <strong>{preview}</strong>
            {form.minimum === 'subtotal' && ` · minimum $${form.minValue} CAD`}
            {form.minimum === 'yards' && ` · minimum ${form.minValue} yards`}
            {form.limitTotal && ` · ${form.usageLimit} total uses`}
            {form.oncePerCustomer && ' · once per customer'}
          </Alert>
        )}

        {discount && discount.method === 'code' && <CodesPanel discount={discount} onChanged={onChanged} />}
        {discount && <RedemptionsPanel discountId={discount.id} />}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Box>{discount && <Button color="error" onClick={remove}>Delete</Button>}</Box>
        <Box>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save discount'}</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ─── List ────────────────────────────────────────────────────────────────────
export default function DiscountsAdmin() {
  const [discounts, setDiscounts] = useState<DiscountSummary[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<DiscountSummary | 'new' | null>(null);

  const load = useCallback(async () => {
    try {
      setDiscounts(await getDiscounts());
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load discounts.');
      setDiscounts([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep an open editor in sync after codes are added (it holds a snapshot of the discount).
  const editingId = editing && editing !== 'new' ? editing.id : null;
  const current = useMemo(() => (editingId ? discounts?.find((d) => d.id === editingId) || null : null), [editingId, discounts]);

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5">Discounts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Create discount</Button>
      </Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Codes customers enter at checkout, or automatic discounts that apply by themselves. One discount per order: a code the customer enters
        takes priority, otherwise the best automatic discount applies. A use counts once the order is paid.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!discounts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : discounts.length === 0 && !error ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>No discounts yet.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Create your first discount</Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Used</TableCell>
                <TableCell align="right">Saved customers</TableCell>
                <TableCell>Dates</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discounts.map((d) => {
                const status = STATUS_CHIP[discountStatus(d)];
                return (
                  <TableRow key={d.id} hover sx={{ cursor: 'pointer' }} onClick={() => setEditing(d)}>
                    <TableCell><strong>{d.title}</strong></TableCell>
                    <TableCell sx={{ fontFamily: d.method === 'code' ? 'monospace' : undefined }}>
                      {d.method === 'automatic' ? <Chip size="small" label="Automatic" variant="outlined" /> : d.codeCount === 1 ? d.codes[0].code : `${d.codeCount} codes`}
                    </TableCell>
                    <TableCell>
                      {describeDiscount(d)}
                      {d.appliesTo === 'sample_books' && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{d.appliesToBooks.length} collection(s)</Typography>}
                    </TableCell>
                    <TableCell><Chip size="small" label={status.label} color={status.color} /></TableCell>
                    <TableCell align="right">{d.uses}{d.usageLimit != null ? ` / ${d.usageLimit}` : ''}</TableCell>
                    <TableCell align="right">{money(d.savedCents)}</TableCell>
                    <TableCell>
                      <Typography variant="caption">{d.startsAt.toLocaleDateString('en-CA', { dateStyle: 'medium' })}{d.endsAt ? ` → ${d.endsAt.toLocaleDateString('en-CA', { dateStyle: 'medium' })}` : ' → no end'}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {editing && (
        <DiscountEditor
          key={editing === 'new' ? 'new' : editing.id}
          discount={editing === 'new' ? null : current || editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            load();
            setEditing(null);
          }}
          onChanged={load}
        />
      )}
    </Box>
  );
}
