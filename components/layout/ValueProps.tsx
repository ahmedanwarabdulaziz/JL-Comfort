'use client';

import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { brand } from '@/lib/theme';
import { useFreeShippingOver } from '@/lib/data/useShippingRate';

// "Why buy from JL Comfort": the three offers as cards. `band` is the full-width homepage section
// under the hero; `compact` stacks them beside the fabric photo, under "Order product". Same offers
// as the announcement bar; the free-shipping amount comes from Admin > Shipping.
export default function ValueProps({ variant }: { variant: 'band' | 'compact' }) {
  const freeShippingOver = useFreeShippingOver();
  const cards = [
    {
      icon: LocalShippingOutlinedIcon,
      title: freeShippingOver !== null ? `Free shipping over $${freeShippingOver.toFixed(0)}` : 'Shipped across Canada',
      body: freeShippingOver !== null ? 'Delivered anywhere in Canada. Prices in Canadian dollars.' : 'Shipping and tax shown before you pay.',
      href: '/shipping-returns',
    },
    {
      icon: ContentCutIcon,
      title: 'Free fabric samples',
      body: 'See the colour and feel the texture at home before you order.',
      href: '/free-fabric-samples',
    },
    {
      icon: VerifiedUserOutlinedIcon,
      title: 'Charlotte Lifetime Warranty',
      body: 'Covered against manufacturing defects, and we handle the claim for you.',
      href: '/shipping-returns#warranty',
    },
  ];

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'grid', gap: 1, mt: 3 }}>
        {cards.map(({ icon: Icon, title, body, href }) => (
          <Box
            key={title}
            component={Link}
            href={href}
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
              p: 1.5,
              bgcolor: brand.chalk,
              border: `1px solid ${brand.chalkLine}`,
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': { borderColor: brand.accent },
            }}
          >
            <Icon sx={{ color: brand.accent, fontSize: 24, mt: 0.25 }} />
            <Box>
              <Typography sx={{ fontWeight: 700, color: brand.ink, fontSize: '0.9rem' }}>{title}</Typography>
              <Typography sx={{ color: brand.textSecondary, fontSize: '0.8rem', lineHeight: 1.5 }}>{body}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box component="section" aria-label="Why buy from JL Comfort" sx={{ bgcolor: brand.chalk, borderBottom: `1px solid ${brand.chalkLine}` }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 1.5, md: 3 } }}>
          {cards.map(({ icon: Icon, title, body, href }) => (
            <Box
              key={title}
              component={Link}
              href={href}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: { xs: 'center', md: 'flex-start' },
                gap: { xs: 2, md: 1.5 },
                p: { xs: 2, md: 3 },
                bgcolor: '#fff',
                border: `1px solid ${brand.chalkLine}`,
                borderTop: { md: `3px solid ${brand.accent}` },
                borderLeft: { xs: `3px solid ${brand.accent}`, md: `1px solid ${brand.chalkLine}` },
                color: 'inherit',
                textDecoration: 'none',
                transition: 'box-shadow 200ms ease, transform 200ms ease',
                '&:hover': { boxShadow: '0 10px 28px rgba(51,56,79,0.12)', transform: { md: 'translateY(-2px)' } },
              }}
            >
              <Box sx={{ flexShrink: 0, width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, borderRadius: '50%', bgcolor: 'rgba(226,129,71,0.12)', display: 'grid', placeItems: 'center' }}>
                <Icon sx={{ color: brand.accent, fontSize: { xs: 26, md: 30 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, color: brand.ink, fontSize: { xs: '1rem', md: '1.15rem' }, mb: 0.5 }}>{title}</Typography>
                <Typography sx={{ color: brand.textSecondary, fontSize: { xs: '0.85rem', md: '0.92rem' }, lineHeight: 1.6 }}>{body}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
