'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/ui/Link';
import { Box, Button, Container, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useFavourites } from '@/lib/context/FavouritesContext';
import { useSampleCart } from '@/lib/context/SampleCartContext';
import FabricCard from '@/components/fabrics/FabricCard';
import { brand } from '@/lib/theme';

const LINE = '#e5e0d9';
const MUTED = '#8b857e';

export default function FavouritesClient() {
  const { items, clearFavourites } = useFavourites();
  const { items: samples, addSample, settings, setListOpen } = useSampleCart();
  // The list comes from this browser's storage, so wait a tick before saying it's empty.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const notSampled = items.filter((f) => !samples.some((s) => s.fabricId === f.fabricId));
  const room = Math.max(0, settings.maxPerRequest - samples.length);
  const toAdd = notSampled.slice(0, room);

  const requestSamples = () => {
    // Added one by one so the sample list keeps its own limit and analytics.
    toAdd.forEach((f) => addSample({ fabricId: f.fabricId, name: f.name, sku: f.sku, imageUrl: f.imageUrl }));
    setListOpen(true);
  };

  return (
    <Box sx={{ minHeight: '70vh', bgcolor: '#fff' }}>
      <Box sx={{ bgcolor: brand.chalk, borderBottom: `1px solid ${LINE}` }}>
        <Container maxWidth="xl" sx={{ py: { xs: 3.5, md: 5 } }}>
          <Typography sx={{ fontSize: '0.74rem', color: MUTED, mb: 1.5 }}>
            <Box component={Link} href="/" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: brand.accent } }}>Home</Box>
            <Box component="span" sx={{ mx: 0.75 }}>›</Box>
            <Box component="span" sx={{ color: brand.ink }}>Favourites</Box>
          </Typography>
          <Typography component="h1" variant="h1" sx={{ fontSize: { xs: '2.1rem', md: '2.9rem' }, color: brand.ink }}>
            Your <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.accent }}>favourites</Box>
          </Typography>
          <Typography sx={{ color: brand.textSecondary, maxWidth: 620, mt: 1.25, lineHeight: 1.7 }}>
            Fabrics you saved with the heart. They&apos;re kept in this browser, so you can come back to compare them or order free samples.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {ready && items.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <FavoriteBorderIcon sx={{ fontSize: 44, color: MUTED, mb: 1.5 }} />
            <Typography variant="h4" sx={{ mb: 1, color: brand.ink }}>No favourites yet</Typography>
            <Typography sx={{ color: brand.textSecondary, mb: 3 }}>Tap the heart on any fabric to save it here.</Typography>
            <Button component={Link} href="/fabrics" variant="outlined" sx={{ borderColor: brand.ink, color: brand.ink }}>Browse fabrics</Button>
          </Box>
        )}

        {items.length > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', pb: 2, borderBottom: `1px solid ${LINE}` }}>
              <Typography sx={{ color: brand.textSecondary, fontSize: '0.9rem' }}>
                {items.length} saved fabric{items.length === 1 ? '' : 's'}
              </Typography>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" onClick={clearFavourites} sx={{ color: brand.accent, '&:hover': { bgcolor: 'transparent', color: brand.ink } }}>
                  Clear list
                </Button>
                {notSampled.length > 0 && (
                  <Button
                    variant="contained"
                    disableElevation
                    disabled={toAdd.length === 0}
                    onClick={requestSamples}
                    sx={{ bgcolor: brand.ink, color: brand.chalk, '&:hover': { bgcolor: brand.accent } }}
                  >
                    {toAdd.length === 0
                      ? 'Sample list is full'
                      : `Add ${toAdd.length === notSampled.length ? (toAdd.length === 1 ? 'it' : `all ${toAdd.length}`) : toAdd.length} to free samples`}
                  </Button>
                )}
              </Box>
            </Box>
            {toAdd.length > 0 && toAdd.length < notSampled.length && (
              <Typography sx={{ fontSize: '0.8rem', color: MUTED, mt: 1.5 }}>
                You can request up to {settings.maxPerRequest} free samples at a time, so only the first {toAdd.length} will be added.
              </Typography>
            )}

            <Box
              sx={{
                mt: 3,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' },
                columnGap: { xs: 2, md: 3 },
                rowGap: { xs: 3.5, md: 5 },
              }}
            >
              {items.map((f) => (
                <FabricCard key={f.fabricId} fabric={{ id: f.fabricId, name: f.name, sku: f.sku, imageUrl: f.imageUrl, pricePerYard: f.pricePerYard }} />
              ))}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
