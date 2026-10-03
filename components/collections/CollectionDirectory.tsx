'use client';

import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { brand } from '@/lib/theme';
import type { CollectionGroup } from '@/lib/collections/definitions';

export interface DirectoryGroup {
  group: CollectionGroup;
  label: string;
  links: { slug: string; label: string }[];
}

// Links to every collection page, grouped: on the main /fabrics page and at the foot of each
// collection. Plain links in the HTML are how search engines discover and weigh these pages.
export default function CollectionDirectory({ groups, currentSlug, heading }: { groups: DirectoryGroup[]; currentSlug?: string; heading?: string }) {
  return (
    <Container id={heading ? 'categories' : undefined} maxWidth="xl" sx={{ py: { xs: 6, md: 8 }, scrollMarginTop: 96 }}>
      {heading && (
        <Typography component="h2" variant="h2" sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, mb: 4 }}>
          {heading}
        </Typography>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 4, md: 5 } }}>
        {groups.map((group) => (
          <Box key={group.group}>
            <Typography
              component={heading ? 'h3' : 'h2'}
              sx={{ color: brand.mocha, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 1.5 }}
            >
              {group.label}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, columns: group.links.length > 10 ? 2 : 1, columnGap: 2 }}>
              {group.links.map((link) => {
                const current = link.slug === currentSlug;
                return (
                  <Box component="li" key={link.slug} sx={{ mb: 0.75, breakInside: 'avoid' }}>
                    <Box
                      component={Link}
                      href={`/fabrics/${link.slug}`}
                      aria-current={current ? 'page' : undefined}
                      sx={{ color: current ? brand.mocha : brand.ink, fontWeight: current ? 700 : 400, textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: brand.mocha, textDecoration: 'underline' } }}
                    >
                      {link.label}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
