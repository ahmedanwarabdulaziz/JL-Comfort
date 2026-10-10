'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

// Admin top-bar button for test payments. It only affects this browser: checkouts made here while
// signed in as an admin go to the Stripe test account. Shoppers always pay live.
export default function StripeTestModeSwitch() {
  const [state, setState] = useState<{ testMode: boolean; available: boolean; storeKey?: 'live' | 'test' | 'missing' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/stripe-mode')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data && setState(data))
      .catch(() => {});
  }, []);

  if (!state) return null;

  const toggle = async () => {
    if (!state.available && !state.testMode) {
      setMessage(
        'Test payments need a Stripe test key. Add STRIPE_TEST_SECRET_KEY (your sk_test_... key from Stripe → Developers → API keys, in Test mode) to the environment variables, then redeploy (or restart the dev server).'
      );
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/stripe-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: !state.testMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not change payment mode.');
      setState(data);
      setMessage(
        data.testMode
          ? 'Test payments are ON in this browser. Checkouts you make here use Stripe test mode: pay with card 4242 4242 4242 4242, any future date and any CVC. Customers still pay for real.'
          : 'Test payments are OFF. Checkouts in this browser are real payments again.'
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not change payment mode.');
    } finally {
      setSaving(false);
    }
  };

  const on = state.testMode;
  // The store's own key, as this deployment sees it: a missing or test key means shoppers can't pay for real.
  const keyWarning =
    state.storeKey === 'missing'
      ? 'Live Stripe key missing'
      : state.storeKey === 'test'
      ? 'Store is on a TEST Stripe key'
      : '';
  return (
    <>
      {keyWarning && (
        <Box
          component="span"
          title="STRIPE_SECRET_KEY on this deployment. Fix it in Vercel → Settings → Environment Variables, then redeploy Production."
          sx={{ mr: 1.5, px: 1.25, py: 0.4, borderRadius: 999, bgcolor: '#d32f2f', color: '#fff', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          ⚠ {keyWarning}
        </Box>
      )}
      <Button
        onClick={toggle}
        disabled={saving}
        disableElevation
        variant={on ? 'contained' : 'outlined'}
        sx={{
          mr: 2,
          px: 1.75,
          py: 0.5,
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.85rem',
          whiteSpace: 'nowrap',
          ...(on
            ? { bgcolor: '#ff9800', color: '#1a1a1a', '&:hover': { bgcolor: '#ffa726' } }
            : { color: '#fff', borderColor: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }),
        }}
      >
        <Box
          component="span"
          sx={{ width: 9, height: 9, borderRadius: '50%', mr: 1, bgcolor: on ? '#1a1a1a' : 'rgba(255,255,255,0.5)' }}
        />
        Test payments: {on ? 'ON' : 'OFF'}
      </Button>
      <Dialog open={!!message} onClose={() => setMessage('')} maxWidth="xs" fullWidth>
        <DialogTitle>Test payments</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessage('')}>OK</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
