'use client';

import { Typography, Button, Container, Box, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { keyframes } from '@emotion/react';
import Link from 'next/link';
import { Product } from '@/lib/types/product';
import { brand, swatchClip } from '@/lib/theme';
import TagButton from '@/components/ui/TagButton';
import CornerTag from '@/components/ui/CornerTag';

interface HomePageClientProps {
  products: Product[];
}

const MARQUEE_MATERIALS = ['Velvet', 'Linen', 'Bouclé', 'Chenille', 'Crypton Performance', 'Tweed & Textures', 'Shearling'];

// Hand-drawn texture treatments instead of live catalog photos — a database
// pick can land on a flat, textureless macro crop that reads as "no image."
// A deliberate illustrated weave is bolder and never breaks.
const COLORWAY_TILES = [
  {
    value: 'velvet',
    label: 'Velvet',
    meta: 'Plush · Railroaded',
    dark: true,
    bg: `repeating-linear-gradient(115deg, rgba(246,242,235,0.1) 0 3px, transparent 3px 9px), linear-gradient(150deg, #8a5f4c, #4a3327)`,
  },
  {
    value: 'linen',
    label: 'Linen',
    meta: 'Breathable · Natural',
    dark: false,
    bg: `repeating-linear-gradient(0deg, rgba(33,23,18,0.06) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(33,23,18,0.05) 0 1px, transparent 1px 6px), ${brand.butter}`,
  },
  {
    value: 'boucle',
    label: 'Bouclé',
    meta: 'Looped · Textured',
    dark: false,
    bg: `radial-gradient(circle at 22% 28%, rgba(255,255,255,0.55) 0 3px, transparent 4px), radial-gradient(circle at 62% 58%, rgba(255,255,255,0.45) 0 3px, transparent 4px), radial-gradient(circle at 40% 82%, rgba(255,255,255,0.5) 0 3px, transparent 4px), ${brand.lime}`,
    bgSize: '34px 34px, 34px 34px, 34px 34px, auto',
  },
  {
    value: 'chenille',
    label: 'Chenille',
    meta: 'Deep Pile · Soft Hand',
    dark: true,
    bg: `repeating-linear-gradient(65deg, rgba(255,255,255,0.1) 0 2px, transparent 2px 7px), linear-gradient(150deg, #3a2e26, ${brand.ink})`,
  },
];

const SAMPLE_STEPS = [
  { n: '01', title: 'Browse Collections', desc: 'Find a sample book that matches your project style or colour palette.' },
  { n: '02', title: 'Select Fabrics', desc: "Click through to the fabric shop, filtered to that book's collection." },
  { n: '03', title: 'Request Swatches', desc: "Add fabrics to your sample cart and we'll ship them to you, on us." },
];

const SPEC_ROWS = [
  { k: 'Fiber Content', v: 'Listed on every swatch' },
  { k: 'Durability', v: 'Martindale double-rub tested' },
  { k: 'Repeat', v: 'Noted per pattern, railroaded where available' },
  { k: 'Cleanability', v: 'Code listed on every product page' },
];

const scroll = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

export default function HomePageClient({ products }: HomePageClientProps) {
  return (
    <>
      {/* ── HERO ── */}
      <Box sx={{ bgcolor: brand.ink, color: brand.chalk }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 5, md: 6 }} alignItems="center" sx={{ pt: { xs: 7, md: 9 }, pb: { xs: 5, md: 0 } }}>
            <Grid item xs={12} md={7}>
              <Typography variant="overline" sx={{ color: brand.lime, display: 'block', mb: 2.5 }}>
                Colorway 001 / New Season
              </Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: '2.7rem', sm: '3.6rem', md: '4.6rem' }, lineHeight: 0.98, letterSpacing: '-0.01em' }}>
                Fabric that
                <br />
                reads the{' '}
                <Box component="em" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.butter }}>
                  room —
                </Box>
                <br />
                and the trend.
              </Typography>
              <Typography sx={{ maxWidth: 480, mt: 3, fontSize: '1.05rem', lineHeight: 1.65, color: brand.inkSoft }}>
                Upholstery textiles curated the way a stylist builds a rack: by hand-feel, by colorway, by what&apos;s
                actually trending this season. Not another beige catalog.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.75, flexWrap: 'wrap', mt: 4.5 }}>
                <TagButton tone="fill" component={Link} href="/fabrics">
                  Shop Fabrics
                </TagButton>
                <TagButton tone="ghost" component={Link} href="/sample-books">
                  Sample Books
                </TagButton>
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  position: 'relative',
                  aspectRatio: '4/5',
                  clipPath: 'polygon(0 0, 100% 0, 100% 86%, 84% 100%, 0 100%)',
                  background: `repeating-linear-gradient(115deg, rgba(246,242,235,0.09) 0 3px, transparent 3px 9px), linear-gradient(160deg, ${brand.mocha} 0%, ${brand.mochaDeep} 55%, #4a3327 100%)`,
                }}
              >
                <Typography
                  sx={{
                    position: 'absolute',
                    left: 18,
                    bottom: 18,
                    right: 18,
                    fontFamily: 'var(--font-label), sans-serif',
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    color: 'rgba(246,242,235,0.85)',
                    textTransform: 'uppercase',
                  }}
                >
                  Hand-feel: Plush · 100K+ Double Rubs
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Marquee ticker */}
        <Box
          sx={{
            mt: { xs: 6, md: 7 },
            bgcolor: brand.mocha,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            borderTop: '1px solid rgba(0,0,0,0.15)',
            borderBottom: '1px solid rgba(0,0,0,0.15)',
          }}
        >
          <Box sx={{ display: 'inline-flex', py: 1.6, animation: `${scroll} 28s linear infinite` }}>
            {[...MARQUEE_MATERIALS, ...MARQUEE_MATERIALS].map((m, i) => (
              <Typography
                key={`${m}-${i}`}
                component="span"
                sx={{
                  fontFamily: 'var(--font-label), sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  px: 2.75,
                  '&::after': { content: '"✂"', ml: '22px', opacity: 0.6 },
                }}
              >
                {m}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── COLORWAY / MOSAIC ── */}
      <Box sx={{ bgcolor: brand.chalk }}>
        <Container maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 3,
              flexWrap: 'wrap',
              mb: { xs: 5, md: 6 },
            }}
          >
            <Box>
              <Typography variant="overline" sx={{ color: brand.mochaDeep, display: 'block', mb: 1.25 }}>
                This Season&apos;s Colorway
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, maxWidth: '14ch' }}>
                Cut from the same cloth as the runway.
              </Typography>
            </Box>
            <Typography sx={{ maxWidth: 360, color: brand.textSecondary, lineHeight: 1.65 }}>
              Four textures pulled from the current forecast — swipe them onto any silhouette in the AI visualizer
              before you commit a single yard.
            </Typography>
          </Box>

          <Grid container spacing={2.25}>
            {COLORWAY_TILES.map((tile, i) => (
              <Grid item xs={12} sm={6} md={3} key={tile.value}>
                <Box
                  component={Link}
                  href={`/fabrics?material=${tile.value}`}
                  sx={{
                    position: 'relative',
                    display: 'block',
                    textDecoration: 'none',
                    aspectRatio: '3/4',
                    p: 2,
                    clipPath: swatchClip(20),
                    background: tile.bg,
                    backgroundSize: tile.bgSize,
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'rotate(-2deg) translateY(-4px)' },
                  }}
                >
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      fontFamily: 'var(--font-label), sans-serif',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      letterSpacing: '0.08em',
                      opacity: 0.6,
                      color: tile.dark ? brand.chalk : brand.ink,
                    }}
                  >
                    0{i + 1}
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-display), serif',
                        fontStyle: 'italic',
                        fontWeight: 600,
                        fontSize: '1.3rem',
                        color: tile.dark ? brand.chalk : brand.ink,
                      }}
                    >
                      {tile.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-label), sans-serif',
                        fontSize: '0.7rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        opacity: 0.75,
                        mt: 0.5,
                        color: tile.dark ? brand.chalk : brand.ink,
                      }}
                    >
                      {tile.meta}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── TREND / SPEC BAND ── */}
      <Box sx={{ bgcolor: brand.butter, color: brand.ink }}>
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
          <Grid container spacing={{ xs: 5, md: 6 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                component="blockquote"
                sx={{
                  fontFamily: 'var(--font-display), serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: { xs: '1.6rem', md: '2.2rem' },
                  lineHeight: 1.28,
                  m: 0,
                }}
              >
                &ldquo;Mocha Mousse isn&apos;t just a wall color anymore — it&apos;s a couch, a headboard, a whole
                mood.&rdquo;
              </Typography>
              <Typography
                component="cite"
                sx={{
                  display: 'block',
                  mt: 2.5,
                  fontFamily: 'var(--font-label), sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                }}
              >
                — JL Comfort, Trend Desk
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                {SPEC_ROWS.map((row) => (
                  <Box
                    key={row.k}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 2,
                      pb: 1.75,
                      borderBottom: '1px solid rgba(33,23,18,0.22)',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-label), sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontSize: '0.78rem',
                        flexShrink: 0,
                      }}
                    >
                      {row.k}
                    </Typography>
                    <Typography sx={{ fontSize: '0.92rem', color: 'rgba(33,23,18,0.7)', textAlign: 'right' }}>
                      {row.v}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── FEATURED PRODUCTS ── */}
      {products.length > 0 && (
        <Box sx={{ bgcolor: brand.chalk }}>
          <Container maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
            <Typography variant="overline" align="center" sx={{ display: 'block', color: brand.mochaDeep, mb: 1.5 }}>
              Just Arrived
            </Typography>
            <Typography variant="h2" align="center" sx={{ mb: 6, fontSize: { xs: '2rem', md: '2.5rem' } }}>
              New &amp; Noteworthy
            </Typography>

            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card elevation={0} sx={{ height: '100%', bgcolor: '#fff', border: `1px solid ${brand.chalkLine}` }}>
                    <CardActionArea sx={{ height: '100%' }}>
                      <Box sx={{ bgcolor: brand.chalk, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, p: 3 }}>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <Typography sx={{ color: brand.textSecondary, letterSpacing: 2, textTransform: 'uppercase' }}>
                            No Image
                          </Typography>
                        )}
                      </Box>
                      <CardContent sx={{ pt: 3, pb: 2.5, px: 2.5 }}>
                        <Typography sx={{ fontFamily: 'var(--font-display), serif', fontWeight: 600, fontSize: '1.15rem', mb: 0.75 }}>
                          {product.name}
                        </Typography>
                        <Typography
                          sx={{
                            color: brand.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 1.5,
                            fontSize: '0.88rem',
                          }}
                        >
                          {product.description}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, fontFamily: 'var(--font-label), sans-serif', letterSpacing: '0.03em' }}>
                          {product.price} {product.currency}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* ── SAMPLE BOOKS ── */}
      <Box sx={{ bgcolor: '#fff' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
          <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <CornerTag tone="dark" sx={{ mb: 2.5 }}>
                Swatches &amp; Samples
              </CornerTag>
              <Typography variant="h2" sx={{ mb: 2.5, fontSize: { xs: '2rem', md: '2.6rem' } }}>
                Experience it{' '}
                <Box component="em" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.mocha }}>
                  in your hands.
                </Box>
              </Typography>
              <Typography sx={{ color: brand.textSecondary, mb: 4.5, lineHeight: 1.75, fontSize: '1.02rem' }}>
                True design requires a tactile touch. Browse our curated sample books, find your favorite fabrics,
                and request complimentary swatches to view in your own light and space.
              </Typography>

              <Box sx={{ display: 'grid', gap: 2.5, mb: 4.5 }}>
                {SAMPLE_STEPS.map((step) => (
                  <Box key={step.n} sx={{ display: 'flex', gap: 2 }}>
                    <Typography
                      sx={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', color: brand.mocha, fontSize: '1.15rem', mt: '-2px' }}
                    >
                      {step.n}
                    </Typography>
                    <Box>
                      <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{step.title}</Typography>
                      <Typography sx={{ color: brand.textSecondary, fontSize: '0.92rem', lineHeight: 1.6 }}>{step.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1.75, flexWrap: 'wrap' }}>
                <TagButton tone="dark" component={Link} href="/sample-books">
                  View Sample Books
                </TagButton>
                <TagButton tone="ghostDark" component={Link} href="/request-samples">
                  Your Sample Cart
                </TagButton>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                {[
                  { bg: brand.chalk, label: 'The Linen Edit', sub: 'Breathable, natural textures' },
                  { bg: '#EADFCB', label: 'Performance', sub: 'Beautiful yet indestructible' },
                  { bg: brand.butter, label: 'Woven Geometry', sub: 'Striking patterns & motifs' },
                  { bg: brand.mocha, label: 'Velvet Reserve', sub: 'The pinnacle of plush', dark: true },
                ].map((book) => (
                  <Grid item xs={6} key={book.label}>
                    <Box
                      component={Link}
                      href="/sample-books"
                      sx={{
                        bgcolor: book.bg,
                        color: book.dark ? brand.chalk : brand.ink,
                        textDecoration: 'none',
                        p: 3.5,
                        aspectRatio: '4/5',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        clipPath: swatchClip(18),
                        transition: 'transform 0.35s ease',
                        '&:hover': { transform: 'translateY(-5px)' },
                      }}
                    >
                      <Typography sx={{ fontFamily: 'var(--font-label), sans-serif', fontWeight: 700, fontSize: '0.7rem', opacity: 0.5 }}>
                        BOOK
                      </Typography>
                      <Box>
                        <Typography sx={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                          {book.label}
                        </Typography>
                        <Typography sx={{ fontFamily: 'var(--font-label), sans-serif', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.7 }}>
                          {book.sub}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── CTA ── */}
      <Box sx={{ bgcolor: brand.ink, color: brand.chalk }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              py: { xs: 7, md: 9 },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="h2" sx={{ color: brand.chalk, fontSize: { xs: '1.9rem', md: '2.6rem' }, maxWidth: '16ch' }}>
              Get the swatches before the season moves on.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.75, flexWrap: 'wrap' }}>
              <TagButton tone="fill" component={Link} href="/sample-books">
                Order Sample Books
              </TagButton>
              <TagButton tone="ghost" component={Link} href="/visualizer">
                Try the AI Visualizer
              </TagButton>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
