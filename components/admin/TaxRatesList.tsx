'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { TaxRate, TaxRateInput } from '@/lib/types/checkout';
import { createTaxRate, deleteTaxRate, getTaxRates, updateTaxRate } from '@/lib/data/taxRates';
import { formatTaxRate } from '@/lib/checkout/pricing';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const COUNTRY_NAMES: Record<string, string> = { CA: 'Canada', US: 'United States' };

type FormState = Omit<TaxRateInput, 'rate' | 'sortOrder'> & { rate: string; sortOrder: string };

const emptyForm: FormState = {
  country: 'CA',
  regionCode: '',
  regionName: '',
  taxName: '',
  rate: '',
  appliesToShipping: true,
  enabled: true,
  sortOrder: '0',
};

function TaxRateDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: TaxRate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(editing ? { ...editing, rate: String(editing.rate), sortOrder: String(editing.sortOrder) } : emptyForm);
  }, [open, editing]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((c) => ({ ...c, [key]: e.target.value }));

  const handleSave = async () => {
    const rate = Number(form.rate);
    if (!/^[A-Za-z]{2}$/.test(form.country)) return setError('Country must be a 2-letter code, e.g. CA or US.');
    if (!form.regionCode.trim() || !form.regionName.trim() || !form.taxName.trim()) return setError('Fill in the region code, region name and tax name.');
    if (form.rate.trim() === '' || !Number.isFinite(rate) || rate < 0 || rate >= 100) return setError('Rate must be a percentage between 0 and 100.');

    const input: TaxRateInput = {
      country: form.country.trim().toUpperCase(),
      regionCode: form.regionCode.trim().toUpperCase(),
      regionName: form.regionName.trim(),
      taxName: form.taxName.trim(),
      rate,
      appliesToShipping: form.appliesToShipping,
      enabled: form.enabled,
      sortOrder: Number(form.sortOrder) || 0,
    };
    setSaving(true);
    try {
      if (editing) await updateTaxRate(editing.id, input);
      else await createTaxRate(input);
      onSaved();
    } catch (err: any) {
      setError(err.code === '23505' ? 'That region already has a tax with this name.' : err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? `Edit ${editing.taxName} — ${editing.regionName}` : 'Add tax'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
          <TextField label="Country code" value={form.country} onChange={set('country')} helperText="CA, US" />
          <TextField label="Province / state code" value={form.regionCode} onChange={set('regionCode')} helperText="ON, BC, NY…" />
          <TextField label="Province / state name" value={form.regionName} onChange={set('regionName')} sx={{ gridColumn: 'span 2' }} />
          <TextField label="Tax name" value={form.taxName} onChange={set('taxName')} helperText="Shown to customers: GST, HST, PST, Sales Tax…" />
          <TextField
            label="Rate"
            value={form.rate}
            onChange={set('rate')}
            inputProps={{ inputMode: 'decimal' }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          />
          <TextField label="Sort order" value={form.sortOrder} onChange={set('sortOrder')} inputProps={{ inputMode: 'numeric' }} />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column' }}>
          <FormControlLabel
            control={<Switch checked={form.appliesToShipping} onChange={(e) => setForm((c) => ({ ...c, appliesToShipping: e.target.checked }))} />}
            label="Also charge this tax on shipping"
          />
          <FormControlLabel
            control={<Switch checked={form.enabled} onChange={(e) => setForm((c) => ({ ...c, enabled: e.target.checked }))} />}
            label="Collect this tax"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TaxRatesList() {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [toDelete, setToDelete] = useState<TaxRate | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setRates(await getTaxRates());
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load tax rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // country -> region -> components, keeping the table's sort order.
  const grouped = useMemo(() => {
    const byCountry = new Map<string, Map<string, TaxRate[]>>();
    for (const rate of rates) {
      const regions = byCountry.get(rate.country) || new Map<string, TaxRate[]>();
      regions.set(rate.regionCode, [...(regions.get(rate.regionCode) || []), rate]);
      byCountry.set(rate.country, regions);
    }
    return byCountry;
  }, [rates]);

  const toggle = async (rate: TaxRate, field: 'enabled' | 'appliesToShipping', value: boolean) => {
    setRates((current) => current.map((r) => (r.id === rate.id ? { ...r, [field]: value } : r)));
    try {
      await updateTaxRate(rate.id, { [field]: value });
    } catch (err: any) {
      setError(err.message || 'Failed to update tax.');
      loadData();
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteTaxRate(toDelete.id);
      setToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tax.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
        <Typography variant="h5">Sales Taxes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDialogOpen(true); }}>
          Add tax
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Taxes charged at checkout, by the customer&apos;s delivery province or state. A region can stack several taxes
        (e.g. GST + PST); each shows as its own line on the customer&apos;s receipt. Only turn a tax on once you are
        registered to collect it — provincial PST/RST/QST start switched off.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : rates.length === 0 ? (
        <Alert severity="warning">
          No tax rates found. Run the migration supabase/migrations/20260924120000_shipping_and_tax.sql in the Supabase SQL editor.
        </Alert>
      ) : (
        Array.from(grouped.entries()).map(([country, regions]) => (
          <Box key={country} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{COUNTRY_NAMES[country] || country}</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Province / state</TableCell>
                    <TableCell>Tax</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="center">On shipping</TableCell>
                    <TableCell align="center">Collect</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from(regions.values()).map((components) => {
                    const combined = components.filter((c) => c.enabled).reduce((sum, c) => sum + c.rate, 0);
                    return components.map((rate, index) => (
                      <TableRow key={rate.id} sx={{ opacity: rate.enabled ? 1 : 0.55 }}>
                        {index === 0 && (
                          <TableCell rowSpan={components.length} sx={{ verticalAlign: 'top', borderRight: 1, borderColor: 'divider' }}>
                            <Typography variant="body2" fontWeight={600}>{rate.regionName}</Typography>
                            <Typography variant="caption" color="text.secondary">{rate.regionCode}</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip size="small" label={`Total ${formatTaxRate(combined)}`} color={combined > 0 ? 'primary' : 'default'} variant="outlined" />
                            </Box>
                          </TableCell>
                        )}
                        <TableCell>{rate.taxName}</TableCell>
                        <TableCell align="right">{formatTaxRate(rate.rate)}</TableCell>
                        <TableCell align="center">
                          <Switch size="small" checked={rate.appliesToShipping} onChange={(e) => toggle(rate, 'appliesToShipping', e.target.checked)} />
                        </TableCell>
                        <TableCell align="center">
                          <Switch size="small" checked={rate.enabled} onChange={(e) => toggle(rate, 'enabled', e.target.checked)} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => { setEditing(rate); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setToDelete(rate)}><DeleteIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      )}

      <TaxRateDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); loadData(); }}
      />
      <DeleteConfirmDialog
        open={!!toDelete}
        productName={toDelete ? `${toDelete.taxName} — ${toDelete.regionName}` : ''}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
