'use client';

import { Box, LinearProgress, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useFreeShippingOver } from '@/lib/data/useShippingRate';
import { brand } from '@/lib/theme';

// "You're $85 away from free shipping" above the cart subtotal. Uses the same threshold and the same
// subtotal checkout uses (lib/checkout/pricing.ts), so the promise here is what checkout charges.
export default function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const threshold = useFreeShippingOver();
  if (threshold === null || subtotal <= 0) return null;

  const remaining = Math.max(0, threshold - subtotal);
  const qualified = remaining === 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <LocalShippingOutlinedIcon sx={{ fontSize: 20, color: qualified ? 'success.main' : brand.accent }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {qualified ? 'Your order ships free!' : `You're $${remaining.toFixed(2)} away from free shipping`}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, (subtotal / threshold) * 100)}
        color={qualified ? 'success' : 'primary'}
        aria-label={`Free shipping on orders over $${threshold.toFixed(0)}`}
        sx={{ height: 6, borderRadius: 3 }}
      />
      {!qualified && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Free shipping on orders over ${threshold.toFixed(0)} CAD.
        </Typography>
      )}
    </Box>
  );
}
