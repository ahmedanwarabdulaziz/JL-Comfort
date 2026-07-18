'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { FabricItem } from '@/lib/types/fabric';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
} from '@/lib/data/charlotteFabricFacets';

interface FabricGalleryStepProps {
  selectedFabric: FabricItem | null;
  onSelect: (fabric: FabricItem | null) => void;
}

export default function FabricGalleryStep({ selectedFabric, onSelect }: FabricGalleryStepProps) {
  const [color, setColor] = useState('');
  const [pattern, setPattern] = useState('');
  const [material, setMaterial] = useState('');
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFabrics = async (pageNum: number, replace: boolean) => {
    if (replace) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (color) params.set('color', color);
      if (pattern) params.set('pattern', pattern);
      if (material) params.set('material', material);
      params.set('page', String(pageNum));

      const response = await fetch(`/api/fabric-catalog?${params.toString()}`);
      const data = await response.json();

      setFabrics((prev) => (replace ? data.fabrics || [] : [...prev, ...(data.fabrics || [])]));
      setHasMore(!!data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading fabric catalog:', err);
      setError('Failed to load fabrics from Charlotte Fabrics. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFabrics(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, pattern, material]);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Browse Fabrics from Charlotte Fabrics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Optional — pick a fabric to pair with your cushion, or skip this step if you&apos;re supplying your own material.
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            <MenuItem value="">Any Color</MenuItem>
            {CHARLOTTE_FABRIC_COLORS.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          >
            <MenuItem value="">Any Pattern</MenuItem>
            {CHARLOTTE_FABRIC_PATTERNS.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Material"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          >
            <MenuItem value="">Any Material</MenuItem>
            {CHARLOTTE_FABRIC_MATERIALS.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Selected fabric summary */}
      {selectedFabric && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, p: 2, bgcolor: 'rgba(227, 194, 154, 0.15)', border: '1px solid rgba(227, 194, 154, 0.6)', borderRadius: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 1, overflow: 'hidden', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}>
            <img src={selectedFabric.imageUrl} alt={selectedFabric.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Selected: {selectedFabric.name}</Typography>
          </Box>
          <Button size="small" onClick={() => onSelect(null)}>Clear</Button>
        </Box>
      )}

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#e3c29a' }} />
        </Box>
      ) : fabrics.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
          No fabrics found for this combination of filters.
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {fabrics.map((fabric) => {
              const isSelected = selectedFabric?.id === fabric.id;
              return (
                <Grid item xs={6} sm={4} md={3} key={fabric.id}>
                  <Card
                    elevation={0}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: isSelected ? '#e3c29a' : 'divider',
                      transition: 'all 0.2s',
                      height: '100%',
                      '&:hover': { borderColor: '#e3c29a' },
                    }}
                    onClick={() => onSelect(fabric)}
                  >
                    <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: '#fff' }}>
                      {fabric.imageUrl ? (
                        <img src={fabric.imageUrl} alt={fabric.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="caption" color="text.secondary">No Image</Typography>
                        </Box>
                      )}
                      {isSelected && (
                        <CheckCircleIcon sx={{ position: 'absolute', top: 6, right: 6, color: '#e3c29a', bgcolor: '#000', borderRadius: '50%' }} />
                      )}
                    </Box>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }} noWrap>
                        {fabric.name}
                      </Typography>
                      {fabric.productUrl && (
                        <Box
                          component="a"
                          href={fabric.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, mt: 0.5, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#000' } }}
                        >
                          <Typography variant="caption">View details</Typography>
                          <OpenInNewIcon sx={{ fontSize: 12 }} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => fetchFabrics(page + 1, false)}
                disabled={loadingMore}
                startIcon={loadingMore ? <CircularProgress size={16} /> : undefined}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </>
      )}

      <Box sx={{ mt: 2 }}>
        <Chip
          label="Fabric images and availability courtesy of charlottefabrics.com"
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      </Box>
    </Box>
  );
}
