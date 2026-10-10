'use client';

import { useEffect, useState } from 'react';
import { Box, Chip, FormControlLabel, Switch, Tooltip } from '@mui/material';

// Admin top-bar switch for test payments. It only affects this browser: checkouts made here while
// signed in as an admin go to the Stripe test account. Shoppers always pay live.
export default function StripeTestModeSwitch() {
  const [state, setState] = useState<{ testMode: boolean; available: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stripe-mode')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data && setState(data))
      .catch(() => {});
  }, []);

  if (!state) return null;

  const toggle = async (testMode: boolean) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/stripe-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not change payment mode.');
      setState(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not change payment mode.');
    } finally {
      setSaving(false);
    }
  };

  const help = !state.available
    ? 'Add STRIPE_TEST_SECRET_KEY (an sk_test_ key) to the environment to enable test payments.'
    : state.testMode
    ? 'Checkouts in THIS browser use Stripe test mode (card 4242 4242 4242 4242). Customers still pay for real.'
    : 'Turn on to place test orders from this browser with Stripe test cards. Customers always pay for real.';

  return (
    <Tooltip title={help}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
        {state.testMode && <Chip size="small" label="TEST PAYMENTS ON" sx={{ bgcolor: '#ff9800', color: '#000', fontWeight: 700 }} />}
        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              size="small"
              color="warning"
              checked={state.testMode}
              disabled={saving || (!state.available && !state.testMode)}
              onChange={(event) => toggle(event.target.checked)}
            />
          }
          label="Test payments"
          slotProps={{ typography: { variant: 'body2' } }}
        />
      </Box>
    </Tooltip>
  );
}
