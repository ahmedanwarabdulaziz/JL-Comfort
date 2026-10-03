'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Switch,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { brand } from '@/lib/theme';
import { CONSENT_OPEN_EVENT, ConsentChoices, readConsent, saveConsent } from '@/lib/consent';

const CATEGORIES: { key: keyof ConsentChoices | 'necessary'; title: string; body: string }[] = [
  {
    key: 'necessary',
    title: 'Strictly necessary',
    body: 'Keep your cart and sample list, remember this choice, and keep checkout secure. The site can’t work without them, so they’re always on.',
  },
  {
    key: 'analytics',
    title: 'Analytics',
    body: 'Help us understand how the site is used (Google Analytics, Microsoft Clarity) so we can fix problems and improve it.',
  },
  {
    key: 'advertising',
    title: 'Advertising',
    body: 'Let Google and Meta (Facebook, Instagram) measure our ads and show you more relevant ones on other sites.',
  },
];

const primaryButtonSx = {
  borderRadius: 0,
  px: 2.5,
  py: 1,
  bgcolor: brand.ink,
  color: brand.chalk,
  fontWeight: 600,
  '&:hover': { bgcolor: brand.mocha },
};
const secondaryButtonSx = {
  borderRadius: 0,
  px: 2.5,
  py: 1,
  borderColor: brand.ink,
  color: brand.ink,
  fontWeight: 600,
  '&:hover': { borderColor: brand.mocha, color: brand.mocha, bgcolor: 'transparent' },
};

// The cookie banner and its preferences dialog. Accepting and rejecting are equally easy, nothing
// optional is pre-ticked, and the footer's "Cookie settings" link reopens the choices at any time.
export default function CookieConsent() {
  const pathname = usePathname();
  const [bannerOpen, setBannerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>({ analytics: false, advertising: false });

  useEffect(() => {
    const saved = readConsent();
    if (saved) setChoices(saved);
    else setBannerOpen(true);

    const openSettings = () => {
      setChoices(readConsent() || { analytics: false, advertising: false });
      setDialogOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, openSettings);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openSettings);
  }, []);

  const decide = (next: ConsentChoices) => {
    saveConsent(next);
    setChoices(next);
    setBannerOpen(false);
    setDialogOpen(false);
  };

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {bannerOpen && !dialogOpen && (
        <Box
          role="region"
          aria-label="Cookie consent"
          sx={{
            position: 'fixed',
            zIndex: 1400,
            left: { xs: 12, md: 24 },
            right: { xs: 12, md: 'auto' },
            bottom: { xs: 12, md: 24 },
            maxWidth: { md: 520 },
            bgcolor: '#fff',
            color: brand.ink,
            border: `1px solid ${brand.chalkLine}`,
            boxShadow: '0 12px 40px rgba(33,23,18,0.18)',
            p: { xs: 2.5, md: 3 },
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontSize: '1.15rem', mb: 1 }}>
            Your privacy, your choice
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.6, color: brand.textSecondary, mb: 2.5 }}>
            We use essential cookies to run this site. With your permission, we&rsquo;d also like to use
            analytics and advertising cookies to improve the site and measure our ads. You can change your mind
            at any time under &ldquo;Cookie settings&rdquo; in the footer. Read our{' '}
            <Box component={Link} href="/privacy#cookies" sx={{ color: brand.mocha }}>
              Privacy Policy
            </Box>
            .
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button variant="outlined" onClick={() => decide({ analytics: false, advertising: false })} sx={secondaryButtonSx}>
              Reject all
            </Button>
            <Button variant="contained" disableElevation onClick={() => decide({ analytics: true, advertising: true })} sx={primaryButtonSx}>
              Accept all
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              sx={{ color: brand.ink, textDecoration: 'underline', fontWeight: 600, '&:hover': { color: brand.mocha, bgcolor: 'transparent', textDecoration: 'underline' } }}
            >
              Customize
            </Button>
          </Box>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ pr: 6 }}>
          Cookie settings
          <IconButton aria-label="Close" onClick={() => setDialogOpen(false)} sx={{ position: 'absolute', right: 12, top: 12 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.6, color: brand.textSecondary, mb: 1 }}>
            Choose which optional cookies we may use. Your choice is saved on this device and applies straight
            away. Details are in our{' '}
            <Box component={Link} href="/privacy#cookies" onClick={() => setDialogOpen(false)} sx={{ color: brand.mocha }}>
              Privacy Policy
            </Box>
            .
          </Typography>
          {CATEGORIES.map((category, index) => {
            const locked = category.key === 'necessary';
            const checked = locked ? true : choices[category.key as keyof ConsentChoices];
            return (
              <Box key={category.key}>
                {index > 0 && <Divider />}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>{category.title}</Typography>
                    <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.55, color: brand.textSecondary }}>{category.body}</Typography>
                  </Box>
                  <Switch
                    checked={checked}
                    disabled={locked}
                    onChange={(event) => setChoices((current) => ({ ...current, [category.key]: event.target.checked }))}
                    inputProps={{ 'aria-label': `${category.title} cookies` }}
                  />
                </Box>
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => decide({ analytics: false, advertising: false })} sx={secondaryButtonSx}>
            Reject all
          </Button>
          <Button variant="outlined" onClick={() => decide(choices)} sx={secondaryButtonSx}>
            Save my choices
          </Button>
          <Button variant="contained" disableElevation onClick={() => decide({ analytics: true, advertising: true })} sx={primaryButtonSx}>
            Accept all
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
