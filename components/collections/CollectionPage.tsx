'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Box, Button, Container, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TuneIcon from '@mui/icons-material/Tune';
import FabricCard, { CardColourway } from '@/components/fabrics/FabricCard';
import CollectionDirectory, { DirectoryGroup } from './CollectionDirectory';
import { brand } from '@/lib/theme';
import { trackSelectItem, trackViewItemList } from '@/lib/analytics/track';
import { collectionHref, type CollectionGroup, type FabricCollection } from '@/lib/collections/definitions';
import type { CollectionFabric } from '@/lib/collections/server';

const LINE = '#e5e0d9';
const MUTED = '#8b857e';

export interface CollectionLink {
  slug: string;
  label: string;
  group: CollectionGroup;
}


const eyebrowSx = { color: brand.mocha, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const };
const chipSx = {
  display: 'inline-flex',
  alignItems: 'center',
  px: 1.75,
  py: 0.75,
  border: `1px solid ${LINE}`,
  color: brand.ink,
  textDecoration: 'none',
  fontSize: '0.82rem',
  bgcolor: '#fff',
  '&:hover': { borderColor: brand.mocha, color: brand.mocha },
};

// A collection landing page (/fabrics/velvet, /fabrics/pet-friendly, ...). Everything a search engine
// needs is in the server-rendered HTML: the heading, the copy, and real links to every fabric shown.
export default function CollectionPage({
  collection,
  fabrics,
  colourways,
  total,
  page,
  pageCount,
  related,
  groups,
}: {
  collection: FabricCollection;
  fabrics: CollectionFabric[];
  colourways: Record<string, CardColourway[]>;
  total: number;
  page: number;
  pageCount: number;
  related: CollectionLink[];
  groups: DirectoryGroup[];
}) {
  const listName = `Collection: ${collection.label}`;
  const toItem = (fabric: CollectionFabric) => ({
    id: fabric.sku || fabric.id,
    name: fabric.name,
    category: 'Fabric',
    price: fabric.pricePerYard,
    quantity: 1,
  });

  useEffect(() => {
    trackViewItemList(listName, fabrics.slice(0, 20).map(toItem));
    // Once per page of results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.slug, page]);

  return (
    <Box sx={{ bgcolor: '#fff', color: brand.ink }}>
      {/* ── Header ── */}
      <Box sx={{ bgcolor: brand.chalk, borderBottom: `1px solid ${LINE}` }}>
        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ fontSize: '0.78rem', color: MUTED, mb: 1.5 }}>
            <Box component={Link} href="/" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: brand.mocha } }}>Home</Box>
            <Box component="span" sx={{ mx: 0.75 }}>›</Box>
            <Box component={Link} href="/fabrics" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: brand.mocha } }}>Fabrics</Box>
            <Box component="span" sx={{ mx: 0.75 }}>›</Box>
            <Box component="span" sx={{ color: brand.ink }}>{collection.label}</Box>
          </Box>
          <Typography component="h1" variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, maxWidth: 900 }}>
            {collection.title}
            {page > 1 && <Box component="span" sx={{ color: MUTED, fontWeight: 400, fontSize: '0.55em' }}> · page {page}</Box>}
          </Typography>
          <Typography sx={{ color: brand.textSecondary, maxWidth: 760, mt: 1.5, lineHeight: 1.75, fontSize: { md: '1.05rem' } }}>
            {collection.intro}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 2.5 }}>
            <Typography sx={{ fontSize: '0.85rem', color: brand.ink, fontWeight: 600 }}>
              {total.toLocaleString()} fabrics · Free samples · Prices in CAD
            </Typography>
            {collection.shopQuery && (
              <Button
                component={Link}
                href={`/fabrics?${collection.shopQuery}`}
                startIcon={<TuneIcon />}
                sx={{ color: brand.ink, borderBottom: `1px solid ${brand.ink}`, borderRadius: 0, px: 0.5, fontSize: '0.8rem', '&:hover': { color: brand.mocha, bgcolor: 'transparent' } }}
              >
                Refine by colour, pattern and more
              </Button>
            )}
          </Box>
          {related.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 3 }}>
              {related.map((link) => (
                <Box key={link.slug} component={Link} href={collectionHref(link.slug)} sx={chipSx}>
                  {link.label}
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* ── Products ── */}
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' },
            columnGap: { xs: 2, md: 3 },
            rowGap: { xs: 3.5, md: 5 },
          }}
        >
          {fabrics.map((fabric) => (
            <FabricCard
              key={fabric.id}
              fabric={fabric}
              colourways={fabric.colorwayGroup ? colourways[fabric.colorwayGroup] : undefined}
              onSelect={() => trackSelectItem(listName, toItem(fabric))}
            />
          ))}
        </Box>

        {pageCount > 1 && (
          <Box component="nav" aria-label="Pages" sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mt: 7 }}>
            {page > 1 && (
              <Box component={Link} href={collectionHref(collection.slug, page - 1)} rel="prev" sx={chipSx}>‹ Previous</Box>
            )}
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <Box
                key={n}
                component={Link}
                href={collectionHref(collection.slug, n)}
                aria-current={n === page ? 'page' : undefined}
                sx={{ ...chipSx, minWidth: 40, justifyContent: 'center', ...(n === page ? { bgcolor: brand.ink, color: brand.chalk, borderColor: brand.ink, '&:hover': {} } : {}) }}
              >
                {n}
              </Box>
            ))}
            {page < pageCount && (
              <Box component={Link} href={collectionHref(collection.slug, page + 1)} rel="next" sx={chipSx}>Next ›</Box>
            )}
          </Box>
        )}
      </Container>

      {/* ── Buying guide ── */}
      <Box sx={{ bgcolor: brand.chalk, borderTop: `1px solid ${LINE}` }}>
        <Container maxWidth="md" sx={{ py: { xs: 6, md: 9 } }}>
          <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>Buying guide</Typography>
          {collection.sections.map((section) => (
            <Box key={section.heading} sx={{ mb: 4 }}>
              <Typography component="h2" variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.8rem' }, mb: 1.5 }}>{section.heading}</Typography>
              <Typography sx={{ lineHeight: 1.85, color: brand.ink }}>{section.body}</Typography>
            </Box>
          ))}
          {collection.faqs && collection.faqs.length > 0 && (
            <Box sx={{ mt: 5 }}>
              <Typography component="h2" variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.8rem' }, mb: 2 }}>Frequently asked questions</Typography>
              {collection.faqs.map((faq) => (
                <Box key={faq.q} sx={{ borderTop: `1px solid ${LINE}`, py: 2.5 }}>
                  <Typography component="h3" sx={{ fontWeight: 700, mb: 0.75 }}>{faq.q}</Typography>
                  <Typography sx={{ lineHeight: 1.8, color: brand.textSecondary }}>{faq.a}</Typography>
                </Box>
              ))}
            </Box>
          )}
          <Box sx={{ mt: 5, p: 3, bgcolor: '#fff', border: `1px solid ${LINE}` }}>
            <Typography sx={{ fontWeight: 700, mb: 0.75 }}>Not sure which one? Order free samples.</Typography>
            <Typography sx={{ color: brand.textSecondary, lineHeight: 1.7, mb: 2 }}>
              Colour and texture never look quite the same on screen. Add fabrics to your sample list from any fabric page and we’ll send swatches to your door, free.
            </Typography>
            <Box component={Link} href="/sample-books" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: brand.ink, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${brand.ink}`, '&:hover': { color: brand.mocha, borderColor: brand.mocha } }}>
              How free samples work <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Every collection, for shoppers and for search engines ── */}
      <CollectionDirectory groups={groups} currentSlug={collection.slug} />
    </Box>
  );
}
