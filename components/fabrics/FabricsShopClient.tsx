'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, Grid, TextField, MenuItem, CircularProgress, Button } from '@mui/material';
import { CharlotteFabricSnapshotItem } from '@/lib/types/charlotteFabric';
import { getCharlotteFabricsSnapshot, filterFabrics } from '@/lib/data/charlotteFabricCatalog';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
} from '@/lib/data/charlotteFabricFacets';
import FabricCard from './FabricCard';

const PAGE_SIZE = 24;

export default function FabricsShopClient() {
  const [color, setColor] = useState('');
  const [pattern, setPattern] = useState('');
  const [material, setMaterial] = useState('');
  const [search, setSearch] = useState('');

  const [allFabrics, setAllFabrics] = useState<CharlotteFabricSnapshotItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCharlotteFabricsSnapshot()
      .then(setAllFabrics)
      .catch((err) => {
        console.error('Error loading Charlotte Fabrics catalog:', err);
        setError('Failed to load fabrics. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => filterFabrics(allFabrics, { color, pattern, material, search }),
    [allFabrics, color, pattern, material, search]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [color, pattern, material, search]);

  const visibleFabrics = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Shop Fabrics
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Real per-yard pricing on thousands of Charlotte Fabrics patterns — order by the yard, or request a
          free sample before you commit.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search name/SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth select size="small" label="Color" value={color} onChange={(e) => setColor(e.target.value)}>
              <MenuItem value="">Any Color</MenuItem>
              {CHARLOTTE_FABRIC_COLORS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth select size="small" label="Pattern" value={pattern} onChange={(e) => setPattern(e.target.value)}>
              <MenuItem value="">Any Pattern</MenuItem>
              {CHARLOTTE_FABRIC_PATTERNS.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth select size="small" label="Material" value={material} onChange={(e) => setMaterial(e.target.value)}>
              <MenuItem value="">Any Material</MenuItem>
              {CHARLOTTE_FABRIC_MATERIALS.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e3c29a' }} />
          </Box>
        ) : visibleFabrics.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
            No fabrics found for this combination of filters.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {filtered.length} fabric{filtered.length === 1 ? '' : 's'}
            </Typography>
            <Grid container spacing={2}>
              {visibleFabrics.map((fabric) => (
                <Grid item xs={6} sm={4} md={3} key={fabric.id}>
                  <FabricCard fabric={fabric} />
                </Grid>
              ))}
            </Grid>

            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button variant="outlined" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Load More
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
