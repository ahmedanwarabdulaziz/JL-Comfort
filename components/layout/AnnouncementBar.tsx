'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { brand } from '@/lib/theme';

// Thin bar above the site header. Not sticky, so the sticky header keeps its place at the top.
export default function AnnouncementBar() {
  const pathname = usePathname();
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
      <Box component={Link} href="/sample-books" sx={{ color: brand.butter, textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
        Free fabric samples
      </Box>
      <Box component="span" sx={{ mx: 1.25, opacity: 0.5 }}>·</Box>
      Shipping across Canada
      <Box component="span" sx={{ mx: 1.25, opacity: 0.5, display: { xs: 'none', sm: 'inline' } }}>·</Box>
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>All prices in CAD</Box>
    </Box>
  );
}
