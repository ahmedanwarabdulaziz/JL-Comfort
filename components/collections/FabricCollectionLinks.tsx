'use client';

import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { brand } from '@/lib/theme';

// "Shop similar fabrics" on a fabric page: links up to every collection the fabric belongs to.
// Gives shoppers a next step and tells search engines how the catalog is organised.
export default function FabricCollectionLinks({ links }: { links: { slug: string; label: string }[] }) {
  if (links.length === 0) return null;
  return (
    <Box sx={{ borderTop: '1px solid #e5e0d9', bgcolor: brand.chalk }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Typography component="h2" sx={{ color: brand.mocha, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 2 }}>
          Shop similar fabrics
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {links.map((link) => (
            <Box
              key={link.slug}
              component={Link}
              href={`/fabrics/${link.slug}`}
              sx={{ px: 2, py: 1, bgcolor: '#fff', border: '1px solid #e5e0d9', color: brand.ink, textDecoration: 'none', fontSize: '0.88rem', '&:hover': { borderColor: brand.mocha, color: brand.mocha } }}
            >
              {link.label}
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
