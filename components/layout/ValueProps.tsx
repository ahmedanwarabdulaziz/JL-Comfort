'use client';

import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { brand } from '@/lib/theme';
import { useFreeShippingOver } from '@/lib/data/useShippingRate';

// "Why buy from JL Comfort": the three offers as cards on a navy band, so they stand out from the
// cream page. `band` is the full-width homepage section under the hero; `compact` is the navy box
// beside the fabric photo, under "Order product". Same offers as the announcement bar; the
// free-shipping amount comes from Admin > Shipping.

const DISPLAY_FONT = 'var(--font-display), serif';
const glow = 'radial-gradient(circle at 30% 30%, rgba(236,159,110,0.35), rgba(226,129,71,0.12) 70%)';

export default function ValueProps({ variant }: { variant: 'band' | 'compact' }) {
  const freeShippingOver = useFreeShippingOver();
  const cards = [
    {
      icon: LocalShippingOutlinedIcon,
      headline: freeShippingOver !== null ? 'Free shipping' : 'Canada-wide',
      detail: freeShippingOver !== null ? `on orders over $${freeShippingOver.toFixed(0)}` : 'shipping, priced in CAD',
      body: 'Delivered anywhere in Canada, with prices in Canadian dollars and no surprises at checkout.',
      href: '/shipping-returns',
    },
    {
      icon: ContentCutIcon,
      headline: 'Free samples',
      detail: 'of every fabric',
      body: 'See the colour and feel the texture at home before you order a single yard.',
      href: '/free-fabric-samples',
    },
    {
      icon: VerifiedUserOutlinedIcon,
      headline: 'Lifetime warranty',
      detail: 'from Charlotte Fabrics',
      body: 'Covered against manufacturing defects, and we handle the claim with Charlotte for you.',
      href: '/shipping-returns#warranty',
    },
  ];

  if (variant === 'compact') {
    return (
      <Box sx={{ mt: 3, bgcolor: brand.ink, color: brand.chalk, borderTop: `3px solid ${brand.accent}`, px: 2, py: 1 }}>
        {cards.map(({ icon: Icon, headline, detail, href }, i) => (
          <Box
            key={headline}
            component={Link}
            href={href}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.75,
              py: 1.5,
              color: 'inherit',
              textDecoration: 'none',
              borderTop: i > 0 ? '1px solid rgba(246,242,235,0.12)' : 'none',
              '&:hover .vp-arrow': { transform: 'translateX(3px)', opacity: 1 },
            }}
          >
            <Box sx={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: glow, display: 'grid', placeItems: 'center' }}>
              <Icon sx={{ color: brand.accentLight, fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontFamily: DISPLAY_FONT, color: brand.accentLight, fontSize: '1.15rem', lineHeight: 1.15 }}>{headline}</Typography>
              <Typography sx={{ color: brand.inkSoft, fontSize: '0.8rem' }}>{detail}</Typography>
            </Box>
            <ArrowForwardIcon className="vp-arrow" sx={{ fontSize: 18, opacity: 0.6, transition: 'transform 200ms ease, opacity 200ms ease' }} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      component="section"
      aria-label="Why buy from JL Comfort"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: brand.ink,
        color: brand.chalk,
        // A soft orange glow behind the cards so the band reads as a feature, not a strip.
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-40% -10% auto auto',
          width: { xs: 320, md: 560 },
          height: { xs: 320, md: 560 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(226,129,71,0.22), transparent 65%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 6, md: 8 } }}>
        <Typography sx={{ color: brand.accent, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', mb: 1 }}>
          Why shop with JL Comfort
        </Typography>
        <Typography variant="h2" sx={{ color: brand.chalk, fontSize: { xs: '1.8rem', md: '2.4rem' }, mb: { xs: 3.5, md: 5 }, maxWidth: '22ch' }}>
          Designer fabric,{' '}
          <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.accent }}>without the risk.</Box>
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2, md: 3 } }}>
          {cards.map(({ icon: Icon, headline, detail, body, href }) => (
            <Box
              key={headline}
              component={Link}
              href={href}
              sx={{
                position: 'relative',
                display: 'flex',
                // Phones: a compact row (icon + headline) so the three fit on about one screen.
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: { xs: 'center', md: 'stretch' },
                gap: { xs: 2, md: 1.5 },
                p: { xs: 2.25, md: 3.5 },
                bgcolor: 'rgba(246,242,235,0.06)',
                border: '1px solid rgba(246,242,235,0.14)',
                borderTop: { md: `4px solid ${brand.accent}` },
                borderLeft: { xs: `4px solid ${brand.accent}`, md: '1px solid rgba(246,242,235,0.14)' },
                color: 'inherit',
                textDecoration: 'none',
                transition: 'transform 220ms ease, box-shadow 220ms ease, background-color 220ms ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  bgcolor: 'rgba(246,242,235,0.1)',
                  boxShadow: '0 18px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(226,129,71,0.5)',
                },
                '&:hover .vp-arrow': { transform: 'translateX(4px)' },
              }}
            >
              <Box sx={{ flexShrink: 0, width: { xs: 52, md: 64 }, height: { xs: 52, md: 64 }, borderRadius: '50%', background: glow, border: '1px solid rgba(236,159,110,0.45)', display: 'grid', placeItems: 'center' }}>
                <Icon sx={{ color: brand.accentLight, fontSize: { xs: 26, md: 32 } }} />
              </Box>
              <Box sx={{ flex: { xs: 1, md: 'none' } }}>
                <Typography sx={{ fontFamily: DISPLAY_FONT, color: brand.accentLight, fontSize: { xs: '1.5rem', md: '2.2rem' }, lineHeight: 1.05 }}>{headline}</Typography>
                <Typography sx={{ color: brand.chalk, fontWeight: 600, fontSize: { xs: '0.9rem', md: '1rem' }, mt: 0.5 }}>{detail}</Typography>
              </Box>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, color: brand.inkSoft, fontSize: '0.92rem', lineHeight: 1.65, flex: 1 }}>{body}</Typography>
              <ArrowForwardIcon sx={{ display: { xs: 'block', md: 'none' }, color: brand.accent, fontSize: 20 }} />
              <Box sx={{ display: { xs: 'none', md: 'inline-flex' }, alignItems: 'center', gap: 0.75, color: brand.accent, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Learn more
                <ArrowForwardIcon className="vp-arrow" sx={{ fontSize: 16, transition: 'transform 220ms ease' }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
