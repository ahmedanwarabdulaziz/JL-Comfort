import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { brand } from '@/lib/brand';
import { GUIDES, guideHref } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Upholstery Fabric Buying Guides',
  alternates: { canonical: '/guides' },
  description: 'Practical guides to choosing and ordering upholstery fabric in Canada: yardage, durability, cleaning codes and more.',
};

export default function GuidesPage() {
  return (
    <Box sx={{ bgcolor: '#fff', pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="md" sx={{ pt: { xs: 5, md: 8 } }}>
        <Typography sx={{ color: brand.accent, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 1 }}>
          Guides
        </Typography>
        <Typography component="h1" variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, lineHeight: 1.1, color: brand.ink, mb: 2 }}>
          Fabric buying guides
        </Typography>
        <Typography sx={{ color: brand.textSecondary, fontSize: '1.05rem', lineHeight: 1.8, mb: 5 }}>
          Everything you need to choose the right upholstery fabric and order the right amount.
        </Typography>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {GUIDES.map((guide) => (
            <Box
              key={guide.slug}
              component={Link}
              href={guideHref(guide.slug)}
              sx={{ display: 'block', p: 3, border: '1px solid #e5e0d9', textDecoration: 'none', '&:hover': { borderColor: brand.accent } }}
            >
              <Typography component="h2" sx={{ fontFamily: 'var(--font-display), serif', fontSize: '1.4rem', color: brand.ink, mb: 0.75 }}>
                {guide.title}
              </Typography>
              <Typography sx={{ color: brand.textSecondary, lineHeight: 1.7 }}>{guide.description}</Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
