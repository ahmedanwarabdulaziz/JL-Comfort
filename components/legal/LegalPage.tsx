'use client';

import type { ReactNode } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { brand } from '@/lib/theme';

export interface LegalSection {
  id: string; // the in-page anchor, e.g. /privacy#cookies
  title: string;
  content: ReactNode;
}

// Shared layout for the Privacy Policy and Terms of Service: a title band, a numbered table of
// contents, then numbered sections, each linkable by its anchor.
export default function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <Box sx={{ bgcolor: '#fff', color: brand.ink, pb: { xs: 8, md: 12 } }}>
      <Box sx={{ bgcolor: brand.chalk, borderBottom: `1px solid ${brand.chalkLine}` }}>
        <Container maxWidth="md" sx={{ py: { xs: 6, md: 9 } }}>
          <Typography sx={{ color: brand.mocha, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 1.5 }}>
            {eyebrow}
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.3rem', md: '3.2rem' }, mb: 2 }}>
            {title}
          </Typography>
          <Typography sx={{ color: brand.textSecondary, fontSize: '0.9rem' }}>Last updated: {lastUpdated}</Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pt: { xs: 5, md: 7 } }}>
        <Box sx={{ fontSize: '1rem', lineHeight: 1.8, color: brand.ink, mb: 5, '& p': { m: 0, mb: 2 } }}>{intro}</Box>

        <Box component="nav" aria-label="Contents" sx={{ border: `1px solid ${brand.chalkLine}`, bgcolor: brand.chalk, p: { xs: 2.5, md: 3.5 }, mb: { xs: 6, md: 8 } }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: brand.mocha, mb: 1.5 }}>
            Contents
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 3, columns: { sm: 2 }, columnGap: 5, '& li': { breakInside: 'avoid', mb: 0.75, fontSize: '0.92rem' } }}>
            {sections.map((section) => (
              <li key={section.id}>
                <Box component="a" href={`#${section.id}`} sx={{ color: brand.ink, textDecoration: 'none', '&:hover': { color: brand.mocha, textDecoration: 'underline' } }}>
                  {section.title}
                </Box>
              </li>
            ))}
          </Box>
        </Box>

        {sections.map((section, index) => (
          <Box
            key={section.id}
            component="section"
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            sx={{
              scrollMarginTop: 96,
              mb: { xs: 5, md: 6 },
              color: brand.ink,
              fontSize: '0.98rem',
              lineHeight: 1.8,
              '& p': { m: 0, mb: 2 },
              '& ul': { m: 0, mb: 2, pl: 3 },
              '& li': { mb: 0.75 },
              '& h3': { fontFamily: 'var(--font-label), sans-serif', fontSize: '1rem', fontWeight: 700, mt: 3, mb: 1 },
              '& a, & button': { color: brand.mocha },
              '& strong': { fontWeight: 700 },
            }}
          >
            <Typography id={`${section.id}-title`} variant="h2" sx={{ fontSize: { xs: '1.45rem', md: '1.7rem' }, mb: 2, display: 'flex', gap: 1.5 }}>
              <Box component="span" sx={{ color: brand.mocha, fontWeight: 400 }}>{index + 1}.</Box>
              {section.title}
            </Typography>
            {section.content}
          </Box>
        ))}
      </Container>
    </Box>
  );
}
