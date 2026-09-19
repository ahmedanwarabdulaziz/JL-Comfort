'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';

const PROVINCES = [
  ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'],
  ['NB', 'New Brunswick'], ['NL', 'Newfoundland and Labrador'], ['NS', 'Nova Scotia'],
  ['NT', 'Northwest Territories'], ['NU', 'Nunavut'], ['ON', 'Ontario'],
  ['PE', 'Prince Edward Island'], ['QC', 'Quebec'], ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
] as const;

type ShippingForm = {
  email: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
};

const initialForm: ShippingForm = {
  email: '', name: '', phone: '', line1: '', line2: '', city: '', province: '', postalCode: '',
};

export default function ShippingPageClient() {
  const { items, cartTotal } = useCart();
  const [form, setForm] = useState<ShippingForm>(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof ShippingForm) => (event: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress: { ...form, country: 'CA' } }),
      });
      const session = await response.json();
      if (!response.ok || session.error) throw new Error(session.error || 'Unable to start checkout.');
      if (!session.url) throw new Error('Stripe checkout URL was not returned.');
      window.location.href = session.url;
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to start checkout.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">Your cart is currently empty.</Typography>
        <Button component={Link} href="/fabrics" sx={{ mt: 2 }}>Continue Shopping</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#faf9f7', minHeight: '100vh', py: { xs: 4, md: 7 } }}>
      <Container maxWidth="lg">
        <Button component={Link} href="/checkout" startIcon={<ArrowBackIcon />} sx={{ mb: 3, color: '#615b55' }}>Back to cart</Button>
        <Typography component="h1" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 400, color: '#252321', mb: 1 }}>Shipping &amp; Tax</Typography>
        <Typography sx={{ color: '#77716b', mb: 4 }}>Enter your Canadian delivery address to calculate applicable taxes and prepare your shipment.</Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.4fr) minmax(300px, .8fr)' }, gap: 4, alignItems: 'start' }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: '1px solid #e5e1dc', borderRadius: 1 }}>
              <Typography sx={{ color: '#252321', fontSize: '1.25rem', mb: 2.5 }}>Delivery information</Typography>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <TextField label="Email address" type="email" required fullWidth value={form.email} onChange={updateField('email')} autoComplete="email" />
                <TextField label="Full name" required fullWidth value={form.name} onChange={updateField('name')} autoComplete="name" />
                <TextField label="Phone number" fullWidth value={form.phone} onChange={updateField('phone')} autoComplete="tel" />
                <TextField label="Address" required fullWidth value={form.line1} onChange={updateField('line1')} autoComplete="address-line1" />
                <TextField label="Apartment, suite, or unit (optional)" fullWidth value={form.line2} onChange={updateField('line2')} autoComplete="address-line2" />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' }, gap: 2 }}>
                  <TextField label="City" required fullWidth value={form.city} onChange={updateField('city')} autoComplete="address-level2" />
                  <FormControl required fullWidth>
                    <InputLabel id="province-label">Province or territory</InputLabel>
                    <Select labelId="province-label" label="Province or territory" value={form.province} onChange={(event) => setForm((current) => ({ ...current, province: event.target.value }))}>
                      {PROVINCES.map(([code, name]) => <MenuItem key={code} value={code}>{name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <TextField label="Postal code" required fullWidth value={form.postalCode} onChange={updateField('postalCode')} inputProps={{ pattern: '[A-Za-z][0-9][A-Za-z] ?[0-9][A-Za-z][0-9]' }} autoComplete="postal-code" />
              </Box>
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f1eb', color: '#625b54', display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                <LockOutlinedIcon sx={{ fontSize: 19, mt: 0.1, color: '#8d6c4b' }} />
                <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.55 }}>Your address is used to calculate Canadian tax and shipping. Payment details are entered securely on Stripe.</Typography>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: '1px solid #e5e1dc', borderRadius: 1, position: { md: 'sticky' }, top: 24 }}>
              <Typography sx={{ color: '#252321', fontSize: '1.2rem', mb: 2 }}>Order summary</Typography>
              <Divider sx={{ mb: 2 }} />
              {items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
                  <Typography sx={{ color: '#625b54', fontSize: '0.88rem' }}>
                    {item.productType === 'fabric' ? item.fabricName : item.productType === 'benchCushion' ? item.cushionStyleName : item.typeName}
                    <Typography component="span" sx={{ color: '#9a938b', fontSize: '0.76rem' }}> x {item.quantity}</Typography>
                  </Typography>
                  <Typography sx={{ color: '#393532', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{'$' + item.totalPrice.toFixed(2)}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="text.secondary">Subtotal</Typography><Typography>{'$' + cartTotal.toFixed(2)} USD</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="text.secondary">Shipping</Typography><Typography color="text.secondary">Shown at payment</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="text.secondary">Canadian tax</Typography><Typography color="text.secondary">Calculated by address</Typography></Box>
              <Divider sx={{ mb: 2 }} />
              <Typography sx={{ color: '#77716b', fontSize: '0.75rem', lineHeight: 1.6, mb: 2.5 }}>The final shipping charge and GST/HST or applicable provincial tax will be shown in secure Stripe Checkout before payment.</Typography>
              <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ py: 1.5, borderRadius: 0, bgcolor: '#252321', '&:hover': { bgcolor: '#8d6c4b' } }}>{isSubmitting ? 'Preparing checkout...' : 'Continue to secure payment'}</Button>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
