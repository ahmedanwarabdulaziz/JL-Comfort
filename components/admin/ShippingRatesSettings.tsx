'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { getShippingRates, saveShippingRate } from '@/lib/data/shippingRates';
import { computeShippingCents, toCents } from '@/lib/checkout/pricing';
import { ShippingLine, ShippingRate } from '@/lib/types/checkout';

const COUNTRY_NAMES: Record<string, string> = { CA: 'Canada', US: 'United States' };

// Form state keeps raw strings so a half-typed "2." doesn't get clobbered while editing.
type RateForm = Record<
  | 'fabricOrderFee'
  | 'fabricPerYard'
  | 'vinylPerYard'
  | 'foamPerItem'
  | 'benchCushionPerItem'
  | 'freeShippingOver'
  | 'deliveryMinDays'
  | 'deliveryMaxDays',
  string
> & { country: string; enabled: boolean };

const toForm = (rate: ShippingRate): RateForm => ({
  country: rate.country,
  enabled: rate.enabled,
  fabricOrderFee: String(rate.fabricOrderFee),
  fabricPerYard: String(rate.fabricPerYard),
  vinylPerYard: String(rate.vinylPerYard),
  foamPerItem: String(rate.foamPerItem),
  benchCushionPerItem: String(rate.benchCushionPerItem),
  freeShippingOver: rate.freeShippingOver === null ? '' : String(rate.freeShippingOver),
  deliveryMinDays: String(rate.deliveryMinDays),
  deliveryMaxDays: String(rate.deliveryMaxDays),
});

const parseMoney = (value: string): number | null => {
  const n = Number(value);
  return value.trim() !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

const fromForm = (form: RateForm): ShippingRate | string => {
  const money = {
    fabricOrderFee: parseMoney(form.fabricOrderFee),
    fabricPerYard: parseMoney(form.fabricPerYard),
    vinylPerYard: parseMoney(form.vinylPerYard),
    foamPerItem: parseMoney(form.foamPerItem),
    benchCushionPerItem: parseMoney(form.benchCushionPerItem),
  };
  if (Object.values(money).some((v) => v === null)) return 'Every fee must be a number of $0 or more.';
  const freeShippingOver = form.freeShippingOver.trim() === '' ? null : parseMoney(form.freeShippingOver);
  if (form.freeShippingOver.trim() !== '' && freeShippingOver === null) return 'Free shipping threshold must be a positive number, or blank.';
  const deliveryMinDays = Number(form.deliveryMinDays);
  const deliveryMaxDays = Number(form.deliveryMaxDays);
  if (!Number.isInteger(deliveryMinDays) || !Number.isInteger(deliveryMaxDays) || deliveryMinDays < 0 || deliveryMaxDays < deliveryMinDays) {
    return 'Delivery days must be whole numbers, with the maximum at least the minimum.';
  }
  return {
    country: form.country,
    enabled: form.enabled,
    ...(money as Record<keyof typeof money, number>),
    freeShippingOver,
    deliveryMinDays,
    deliveryMaxDays,
  };
};

function MoneyField({ label, value, onChange, helperText, unit }: { label: string; value: string; onChange: (v: string) => void; helperText?: string; unit?: string }) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      helperText={helperText}
      inputProps={{ inputMode: 'decimal' }}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
        endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined,
      }}
      fullWidth
    />
  );
}

function ShippingExample({ rate }: { rate: ShippingRate | null }) {
  const [example, setExample] = useState({ fabricYards: '5', vinylYards: '0', foam: '0', cushions: '0', subtotal: '250' });
  const count = (v: string) => Math.max(0, Math.floor(Number(v) || 0));

  const shipping = useMemo(() => {
    if (!rate) return null;
    const subtotalCents = toCents(Number(example.subtotal) || 0);
    const lines: ShippingLine[] = [
      { kind: 'fabric', quantity: count(example.fabricYards), amountCents: 0 },
      { kind: 'vinyl', quantity: count(example.vinylYards), amountCents: 0 },
      { kind: 'foam', quantity: count(example.foam), amountCents: 0 },
      { kind: 'benchCushion', quantity: count(example.cushions), amountCents: 0 },
    ].filter((line) => line.quantity > 0) as ShippingLine[];
    if (lines.length === 0) return 0;
    lines[0] = { ...lines[0], amountCents: subtotalCents }; // only the total matters for the free-shipping check
    return computeShippingCents(lines, rate);
  }, [rate, example]);

  const field = (key: keyof typeof example, label: string) => (
    <TextField size="small" label={label} value={example[key]} onChange={(e) => setExample((c) => ({ ...c, [key]: e.target.value }))} inputProps={{ inputMode: 'decimal' }} />
  );

  return (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom>Try an example order</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 1.5, mb: 1.5 }}>
        {field('fabricYards', 'Fabric yards')}
        {field('vinylYards', 'Vinyl yards')}
        {field('foam', 'Foam pieces')}
        {field('cushions', 'Bench cushions')}
        {field('subtotal', 'Order subtotal $')}
      </Box>
      <Typography>
        Customer pays for shipping:{' '}
        <strong>{shipping === null ? 'Fix the errors above' : shipping === 0 ? '$0.00 (free)' : `$${(shipping / 100).toFixed(2)}`}</strong>
      </Typography>
    </Box>
  );
}

function CountryRateCard({ initial }: { initial: ShippingRate }) {
  const [form, setForm] = useState<RateForm>(toForm(initial));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const parsed = fromForm(form);
  const set = (key: keyof RateForm) => (value: string) => setForm((c) => ({ ...c, [key]: value }));

  const handleSave = async () => {
    if (typeof parsed === 'string') {
      setMessage({ type: 'error', text: parsed });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveShippingRate(parsed);
      setForm(toForm(saved));
      setMessage({ type: 'success', text: 'Shipping rates saved. Checkout uses them immediately.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save shipping rates.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Shipping to {COUNTRY_NAMES[form.country] || form.country}</Typography>
        <FormControlLabel
          control={<Switch checked={form.enabled} onChange={(e) => setForm((c) => ({ ...c, enabled: e.target.checked }))} />}
          label={form.enabled ? 'Accepting orders' : 'Checkout closed'}
        />
      </Box>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Typography variant="subtitle1" fontWeight={600}>Fabric &amp; vinyl</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The order fee is charged once when the cart has any fabric or vinyl, plus the per-yard rate for every yard.
        A fabric is treated as vinyl when its catalog material or construction type says &quot;vinyl&quot;.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <MoneyField label="Order fee" value={form.fabricOrderFee} onChange={set('fabricOrderFee')} unit="per order" />
        <MoneyField label="Fabric" value={form.fabricPerYard} onChange={set('fabricPerYard')} unit="per yard" />
        <MoneyField label="Vinyl" value={form.vinylPerYard} onChange={set('vinylPerYard')} unit="per yard" />
      </Box>

      <Typography variant="subtitle1" fontWeight={600}>Foam &amp; bench cushions</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Charged per piece ordered. Set to 0 to include shipping in the product price.</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <MoneyField label="Foam" value={form.foamPerItem} onChange={set('foamPerItem')} unit="per piece" />
        <MoneyField label="Bench cushion" value={form.benchCushionPerItem} onChange={set('benchCushionPerItem')} unit="per cushion" />
      </Box>

      <Typography variant="subtitle1" fontWeight={600}>Free shipping &amp; delivery estimate</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mt: 1.5, mb: 3 }}>
        <MoneyField label="Free shipping on orders over" value={form.freeShippingOver} onChange={set('freeShippingOver')} helperText="Leave blank for no free shipping" />
        <TextField label="Delivery: min business days" value={form.deliveryMinDays} onChange={(e) => set('deliveryMinDays')(e.target.value)} inputProps={{ inputMode: 'numeric' }} />
        <TextField label="Delivery: max business days" value={form.deliveryMaxDays} onChange={(e) => set('deliveryMaxDays')(e.target.value)} inputProps={{ inputMode: 'numeric' }} />
      </Box>

      <ShippingExample rate={typeof parsed === 'string' ? null : parsed} />

      <Divider sx={{ my: 2 }} />
      <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={saving}>
        Save shipping rates
      </Button>
    </Paper>
  );
}

export default function ShippingRatesSettings() {
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getShippingRates()
      .then(setRates)
      .catch((err) => {
        setError(err.message || 'Failed to load shipping rates.');
        setRates([]);
      });
  }, []);

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h5" gutterBottom>Shipping Rates</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        What customers are charged for shipping at checkout. Changes apply to the next checkout; they are shown to the
        customer before payment and charged as a &quot;Shipping&quot; line on the Stripe receipt.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {rates === null ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : rates.length === 0 && !error ? (
        <Alert severity="warning">
          No shipping rates found. Run the migration supabase/migrations/20260924120000_shipping_and_tax.sql in the Supabase SQL editor.
        </Alert>
      ) : (
        rates.map((rate) => <CountryRateCard key={rate.country} initial={rate} />)
      )}
    </Box>
  );
}
