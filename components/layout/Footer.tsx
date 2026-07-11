'use client';

import { usePathname } from 'next/navigation';
import { Box, Container, Grid, Typography, Link as MuiLink, Divider, Button } from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const shopLinks = [
  { label: 'Custom Foam Order', href: '/foam' },
  { label: 'AI Fabric Visualizer', href: '/visualizer' },
];

const resourceLinks = [
  { label: 'How to Measure', href: '/how-to-measure' },
  { label: 'Choosing Your Firmness', href: '/firmness-guide' },
  { label: 'Fibre Wrap Guide', href: '/fibre-wrap' },
  { label: 'FAQ', href: '/faq' },
];

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Shipping & Returns', href: '/shipping-returns' },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <Box component="footer" sx={{ mt: 'auto' }}>
      {/* CTA strip */}
      <Box sx={{ bgcolor: '#e3c29a', color: '#000' }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              py: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Ready to start your custom foam order?
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Measure, pick your grade, and check out in minutes.
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/foam"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: '#000',
                color: '#e3c29a',
                fontWeight: 'bold',
                px: 3,
                py: 1.2,
                flexShrink: 0,
                '&:hover': { bgcolor: '#1a1a1a' },
              }}
            >
              Start Your Order
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Main footer body */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          color: 'rgba(255,255,255,0.7)',
          pt: 7,
          pb: 4,
          background: 'linear-gradient(180deg, #171310 0%, #0a0908 45%, #000000 100%)',
        }}
      >
        {/* decorative glow accents */}
        <Box sx={{ position: 'absolute', top: -80, left: '10%', width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(227, 194, 154, 0.08)', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -100, right: '5%', width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(227, 194, 154, 0.06)', filter: 'blur(90px)', pointerEvents: 'none' }} />

        <Container maxWidth="xl" sx={{ position: 'relative' }}>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 2, mb: 2 }}>
                <span style={{ color: '#e3c29a' }}>JL</span> <span style={{ color: '#fff' }}>COMFORT</span>
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Custom foam, cut to your exact measurements. Premium NeoGel High-Density foam for cushions that hold their shape.
              </Typography>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e3c29a', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                Shop
              </Typography>
              {shopLinks.map((link) => (
                <MuiLink
                  key={link.href}
                  component={Link}
                  href={link.href}
                  underline="hover"
                  sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 1, '&:hover': { color: '#e3c29a' } }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e3c29a', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                Resources
              </Typography>
              {resourceLinks.map((link) => (
                <MuiLink
                  key={link.href}
                  component={Link}
                  href={link.href}
                  underline="hover"
                  sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 1, '&:hover': { color: '#e3c29a' } }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e3c29a', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                Company
              </Typography>
              {companyLinks.map((link) => (
                <MuiLink
                  key={link.href}
                  component={Link}
                  href={link.href}
                  underline="hover"
                  sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 1, '&:hover': { color: '#e3c29a' } }}
                >
                  {link.label}
                </MuiLink>
              ))}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: '#e3c29a' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>[Phone Number]</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 18, color: '#e3c29a' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>[email@jlcomfort.com]</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: '#e3c29a', mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>[Business Address]</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', textAlign: 'center' }}>
            © {new Date().getFullYear()} JL Comfort. All rights reserved. Contact details on this site are placeholders pending setup.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
