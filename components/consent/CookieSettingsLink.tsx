'use client';

import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { openConsentSettings } from '@/lib/consent';

// A text link that reopens the cookie preferences, for the footer and the Privacy Policy.
export default function CookieSettingsLink({ label = 'Cookie settings', sx }: { label?: string; sx?: SxProps<Theme> }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={openConsentSettings}
      sx={[
        { p: 0, border: 0, bgcolor: 'transparent', font: 'inherit', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label}
    </Box>
  );
}
