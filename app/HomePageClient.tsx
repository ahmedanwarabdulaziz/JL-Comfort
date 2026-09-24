'use client';

import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { brand } from '@/lib/theme';
import TagButton from '@/components/ui/TagButton';
import SampleBookCover, { bookSeries, cleanBookName } from '@/components/fabrics/SampleBookCover';
import type { HomeCatalog } from '@/lib/data/homeCatalog';

const LINE = '#e5e0d9';

const HERO_PHOTO = 'https://www.charlottefabrics.com/wp-content/uploads/2023/12/20420-01_Large-v1.jpg';

const SAMPLE_STEPS = [
  { n: '01', title: 'Browse collections', desc: 'Find a sample book that suits your project, style or colour palette.' },
  { n: '02', title: 'Pick your fabrics', desc: 'Open any fabric and add a free sample to your list.' },
  { n: '03', title: 'Feel them at home', desc: "We ship the swatches to you and email the tracking number." },
];

// Image + text + two buttons, alternating sides, like a dealer's featured-brand blocks.
const FEATURES: {
  eyebrow: string;
  title: string;
  italic: string;
  body: string;
  photo: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  steps?: boolean;
  hidden?: boolean; // not launched yet: kept here, not shown
}[] = [
  {
    eyebrow: 'Free samples',
    title: 'See it in',
    italic: 'your own light.',
    body: 'Screens never show colour and texture quite right. Order free swatches of any fabric before you commit to yardage.',
    photo: 'https://www.charlottefabrics.com/wp-content/uploads/2023/12/20440-01_Large-v1.jpg',
    primary: { label: 'Order free samples', href: '/sample-books' },
    secondary: { label: 'Your sample list', href: '/request-samples' },
    steps: true,
  },
  {
    eyebrow: 'Performance fabrics',
    title: 'Beautiful, and',
    italic: 'built for real life.',
    body: 'Stain-resistant, cleanable performance fabrics for homes with kids, pets and busy dining rooms, without giving up on texture.',
    photo: 'https://www.charlottefabrics.com/wp-content/uploads/2023/12/20940-10_Large-v1.jpg',
    primary: { label: 'Shop performance', href: '/fabrics?material=crypton' },
    secondary: { label: 'Order samples', href: '/sample-books' },
  },
  {
    eyebrow: 'Made in our workshop',
    title: 'Custom foam and',
    italic: 'bench cushions.',
    body: 'Foam cut to your exact measurements, and bench cushions made to order in the fabric you choose.',
    photo: '/images/bench-cushions.png',
    primary: { label: 'Custom foam', href: '/foam' },
    secondary: { label: 'Bench cushions', href: '/bench-cushions' },
    hidden: true,
  },
  {
    eyebrow: 'AI visualizer',
    title: 'Try the fabric',
    italic: 'before you buy it.',
    body: 'Upload a photo of your sofa or chair and see it in any fabric from the catalog.',
    photo: '/images/ai-visualizer.png',
    primary: { label: 'Try the visualizer', href: '/visualizer' },
    hidden: true,
  },
];

function SectionHeading({ eyebrow, title, italic, link }: { eyebrow: string; title: string; italic: string; link?: { label: string; href: string } }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: { xs: 3.5, md: 4.5 } }}>
      <Box>
        <Typography sx={{ color: brand.mocha, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 1 }}>{eyebrow}</Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' }, color: brand.ink }}>
          {title}{' '}
          <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.mocha }}>{italic}</Box>
        </Typography>
      </Box>
      {link && (
        <Box component={Link} href={link.href} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: brand.ink, textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `1px solid ${brand.ink}`, pb: 0.25, '&:hover': { color: brand.mocha, borderColor: brand.mocha } }}>
          {link.label} <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Box>
      )}
    </Box>
  );
}

export default function HomePageClient({ catalog }: { catalog: HomeCatalog }) {
  return (
    <>
      {/* ── HERO: full-width image with the main message ── */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 460, md: 560 },
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(90deg, rgba(33,23,18,0.88) 0%, rgba(33,23,18,0.62) 45%, rgba(33,23,18,0.15) 100%), url(${HERO_PHOTO})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: brand.chalk,
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
          <Typography sx={{ color: brand.butter, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', mb: 2 }}>
            Designer fabric · Custom upholstery
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.6rem', sm: '3.4rem', md: '4.2rem' }, lineHeight: 1.02, maxWidth: '13ch', color: brand.chalk }}>
            Fabric by the yard,{' '}
            <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.butter }}>shipped across Canada.</Box>
          </Typography>
          <Typography sx={{ maxWidth: 480, mt: 2.5, fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(246,242,235,0.85)' }}>
            Thousands of upholstery and multipurpose fabrics, priced in Canadian dollars, with a free sample of every one.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.75, flexWrap: 'wrap', mt: 4 }}>
            <TagButton tone="fill" component={Link} href="/fabrics">Shop fabrics</TagButton>
            <TagButton tone="ghost" component={Link} href="/sample-books">Order free samples</TagButton>
          </Box>
        </Container>
      </Box>

      {/* ── COLLECTIONS ── */}
      {catalog.collections.length > 0 && (
        <Box sx={{ bgcolor: '#fff' }}>
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
            <SectionHeading eyebrow="Sample books" title="Explore our" italic="collections" link={{ label: 'All sample books', href: '/sample-books' }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2.5, md: 3.5 } }}>
              {catalog.collections.map((book) => (
                <Box
                  key={book.name}
                  component={Link}
                  href={`/fabrics?sampleBook=${encodeURIComponent(book.name)}`}
                  sx={{ textDecoration: 'none', color: 'inherit', '& .cover': { transition: 'transform .25s' }, '&:hover .cover': { transform: 'translateY(-4px)' }, '&:hover .name': { color: brand.mocha } }}
                >
                  <Box className="cover">
                    <SampleBookCover
                      title={cleanBookName(book.name)}
                      series={bookSeries(book.name)}
                      footnote={`${book.count} fabrics`}
                      photo={book.photos[0]}
                      edgePhotos={book.photos.slice(1)}
                    />
                  </Box>
                  <Typography className="name" sx={{ mt: 1.5, textAlign: 'center', fontWeight: 600, fontSize: '0.92rem', color: brand.ink, transition: 'color .2s' }}>
                    {cleanBookName(book.name)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* ── SHOP BY MATERIAL ── */}
      {catalog.materials.length > 0 && (
        <Box sx={{ bgcolor: brand.chalk, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
            <SectionHeading eyebrow="Shop by material" title="Find your" italic="texture" link={{ label: 'All fabrics', href: '/fabrics' }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2, md: 2.5 } }}>
              {catalog.materials.map((m) => (
                <Box
                  key={m.value}
                  component={Link}
                  href={`/fabrics?material=${m.value}`}
                  sx={{ position: 'relative', display: 'block', aspectRatio: '1 / 1', overflow: 'hidden', bgcolor: '#ddd6cc', textDecoration: 'none', '&:hover img': { transform: 'scale(1.06)' } }}
                >
                  {m.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s ease' }} />
                  )}
                  <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: { xs: 1.5, md: 2 }, background: 'linear-gradient(180deg, rgba(33,23,18,0) 0%, rgba(33,23,18,0.82) 100%)', color: brand.chalk }}>
                    <Typography sx={{ fontFamily: 'var(--font-display), serif', fontSize: { xs: '1.15rem', md: '1.35rem' }, fontWeight: 600, lineHeight: 1.1 }}>{m.label}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85, mt: 0.4 }}>
                      {m.count.toLocaleString()} fabrics
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* ── FEATURE BLOCKS ── */}
      <Box sx={{ bgcolor: '#fff' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 }, display: 'grid', gap: { xs: 8, md: 11 } }}>
          {FEATURES.filter((f) => !f.hidden).map((f, i) => (
            <Box
              key={f.eyebrow}
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 3.5, md: 7 }, alignItems: 'center' }}
            >
              <Box sx={{ order: { md: i % 2 === 0 ? 0 : 1 }, aspectRatio: '5 / 4', overflow: 'hidden', bgcolor: brand.chalk }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.photo} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </Box>
              <Box>
                <Typography sx={{ color: brand.mocha, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 1.25 }}>{f.eyebrow}</Typography>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' }, color: brand.ink, mb: 2 }}>
                  {f.title}{' '}
                  <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.mocha }}>{f.italic}</Box>
                </Typography>
                <Typography sx={{ color: brand.textSecondary, lineHeight: 1.75, fontSize: '1rem', maxWidth: 480 }}>{f.body}</Typography>
                {f.steps && (
                  <Box sx={{ display: 'grid', gap: 2, mt: 3 }}>
                    {SAMPLE_STEPS.map((step) => (
                      <Box key={step.n} sx={{ display: 'flex', gap: 2 }}>
                        <Typography sx={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', color: brand.mocha, fontSize: '1.1rem', mt: '-2px' }}>{step.n}</Typography>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: brand.ink }}>{step.title}</Typography>
                          <Typography sx={{ color: brand.textSecondary, fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3.5 }}>
                  <TagButton tone="dark" component={Link} href={f.primary.href}>{f.primary.label}</TagButton>
                  {f.secondary && (
                    <TagButton tone="ghostDark" component={Link} href={f.secondary.href}>{f.secondary.label}</TagButton>
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Container>
      </Box>

      {/* ── CLOSING CTA ── */}
      <Box sx={{ bgcolor: brand.ink, color: brand.chalk }}>
        <Container maxWidth="lg">
          <Box sx={{ py: { xs: 7, md: 9 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Typography variant="h2" sx={{ color: brand.chalk, fontSize: { xs: '1.9rem', md: '2.5rem' }, maxWidth: '18ch' }}>
              Not sure yet?{' '}
              <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.butter }}>Start with a sample.</Box>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.75, flexWrap: 'wrap' }}>
              <TagButton tone="fill" component={Link} href="/sample-books">Browse sample books</TagButton>
              <TagButton tone="ghost" component={Link} href="/fabrics">Shop all fabrics</TagButton>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
