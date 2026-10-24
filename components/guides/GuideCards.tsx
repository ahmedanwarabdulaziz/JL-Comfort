import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { brand } from '@/lib/brand';
import { getGuide, guideHref } from '@/lib/guides';

// A row of guide cards (homepage, shop page). Takes slugs so each page picks the guides that fit it.
export default function GuideCards({ slugs }: { slugs: string[] }) {
  const guides = slugs.map(getGuide).filter(Boolean).map((g) => g!);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${Math.min(guides.length, 4)}, 1fr)` }, gap: { xs: 2, md: 2.5 } }}>
      {guides.map((guide) => (
        <Box
          key={guide.slug}
          component={Link}
          href={guideHref(guide.slug)}
          sx={{ display: 'flex', flexDirection: 'column', p: 3, bgcolor: '#fff', border: '1px solid #e5e0d9', textDecoration: 'none', transition: 'border-color .2s', '&:hover': { borderColor: brand.accent }, '&:hover .read': { color: brand.accent } }}
        >
          <Typography sx={{ color: brand.accent, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 1 }}>
            Guide
          </Typography>
          <Typography component="h3" sx={{ fontFamily: 'var(--font-display), serif', fontSize: '1.25rem', lineHeight: 1.25, color: brand.ink, mb: 1 }}>
            {guide.title}
          </Typography>
          <Typography sx={{ color: brand.textSecondary, fontSize: '0.88rem', lineHeight: 1.6, flex: 1 }}>{guide.description}</Typography>
          <Typography className="read" sx={{ color: brand.ink, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mt: 2 }}>
            Read the guide →
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
