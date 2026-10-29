'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { brand } from '@/lib/theme';
import { useFreeShippingOver } from '@/lib/data/useShippingRate';

const linkSx = { color: brand.accent, textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } };
const dot = (hideOnPhone = false) => (
  <Box component="span" sx={{ mx: 1.25, opacity: 0.5, display: hideOnPhone ? { xs: 'none', sm: 'inline' } : 'inline' }}>·</Box>
);

// Thin bar above the site header. Not sticky, so the sticky header keeps its place at the top.
// Leads with free shipping when Admin > Shipping sets a threshold; phones show the first two offers.
export default function AnnouncementBar() {
  const pathname = usePathname();
  const freeShippingOver = useFreeShippingOver();
  if (pathname?.startsWith('/admin')) return null; // same rule as SiteHeader

  return (
    <Box
      sx={{
        bgcolor: brand.ink,
        color: brand.chalk,
        fontSize: { xs: '0.7rem', md: '0.74rem' },
        letterSpacing: '0.08em',
        textAlign: 'center',
        py: 0.9,
        px: 2,
      }}
    >
      {freeShippingOver !== null ? (
        <>
          <Box component={Link} href="/shipping-returns" sx={linkSx}>
            Free shipping over ${freeShippingOver.toFixed(0)}
          </Box>
          {dot()}
        </>
      ) : null}
      <Box component={Link} href="/free-fabric-samples" sx={linkSx}>
        Free fabric samples
      </Box>
      {dot(true)}
      <Box component={Link} href="/shipping-returns#warranty" sx={{ ...linkSx, color: 'inherit', fontWeight: 400, display: { xs: 'none', sm: 'inline' } }}>
        Charlotte Lifetime Warranty
      </Box>
      {freeShippingOver === null && (
        <>
          {dot(true)}
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Shipping across Canada</Box>
        </>
      )}
    </Box>
  );
}
