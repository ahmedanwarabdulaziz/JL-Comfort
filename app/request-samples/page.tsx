'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSampleCart } from '@/lib/context/SampleCartContext';

export default function RequestSamplesPage() {
  const { items, removeSample, clearSamples } = useSampleCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    items.length > 0 && name.trim() && email.trim() && line1.trim() && city.trim() && state.trim() && zip.trim() && country.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/fabric-samples/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          name,
          email,
          phone,
          address: { line1, line2, city, state, zip, country },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit sample request.');
        return;
      }
      clearSamples();
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting sample request:', err);
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Sample request submitted!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We&apos;ll ship your swatches shortly.
        </Typography>
        <Button component={Link} href="/fabrics" variant="contained" sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#222' } }}>
          Continue Browsing Fabrics
        </Button>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No samples selected yet.
        </Typography>
        <Button component={Link} href="/fabrics" variant="contained" sx={{ mt: 2, bgcolor: '#000', '&:hover': { bgcolor: '#222' } }}>
          Browse Fabrics
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Button component={Link} href="/fabrics" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
        Continue Shopping
      </Button>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Request Free Samples
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        We&apos;ll mail these swatches to you at no cost.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Your Samples ({items.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {items.map((item) => (
                <Stack key={item.fabricId} direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 44, height: 44, borderRadius: 1, overflow: 'hidden', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}>
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight="bold" noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {item.sku}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => removeSample(item.fabricId)} sx={{ color: 'error.main' }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Shipping Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth size="small" />
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth size="small" />
              <TextField label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth size="small" />
              <TextField label="Address Line 1" value={line1} onChange={(e) => setLine1(e.target.value)} required fullWidth size="small" />
              <TextField label="Address Line 2 (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} fullWidth size="small" />
              <Stack direction="row" spacing={2}>
                <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} required fullWidth size="small" />
                <TextField label="State/Province" value={state} onChange={(e) => setState(e.target.value)} required fullWidth size="small" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="ZIP/Postal Code" value={zip} onChange={(e) => setZip(e.target.value)} required fullWidth size="small" />
                <TextField label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required fullWidth size="small" />
              </Stack>

              {error && (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              )}

              <Button
                variant="contained"
                size="large"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#222' } }}
              >
                {submitting ? 'Submitting...' : 'Submit Sample Request'}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
