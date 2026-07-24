'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { CharlotteFabric } from '@/lib/types/charlotteFabric';
import { FabricPriceTier } from '@/lib/types/fabricPriceTier';
import { getFabricPriceTiers } from '@/lib/data/fabricPriceTiers';
import { getCharlotteFabrics, filterFabrics } from '@/lib/data/charlotteFabricCatalog';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
} from '@/lib/data/charlotteFabricFacets';

interface FabricGalleryStepProps {
  selectedFabric: FabricItem | null;
  onSelect: (fabric: FabricItem | null, tier: FabricPriceTier | null) => void;
  estimatedYards: number;
}

const PAGE_SIZE = 24;

const toFabricItem = (fabric: CharlotteFabric): FabricItem => ({
  id: fabric.id,
  name: fabric.name,
  imageUrl: fabric.imageUrl,
  color: fabric.color,
  style: fabric.pattern,
  fabricType: fabric.material[0] || 'Upholstery',
  source: 'charlotte-fabrics',
  productUrl: fabric.productUrl,
  price: 'See website',
  description: `Premium upholstery fabric from Charlotte Fabrics. ${fabric.name}.`,
  tags: ['charlotte-fabrics', ...fabric.color, ...fabric.pattern, ...fabric.material],
});

export default function FabricGalleryStep({ selectedFabric, onSelect, estimatedYards }: FabricGalleryStepProps) {
  const [color, setColor] = useState('');
  const [pattern, setPattern] = useState('');
  const [material, setMaterial] = useState('');
  const [application, setApplication] = useState('');
  const [market, setMarket] = useState('');

  const [allFabrics, setAllFabrics] = useState<CharlotteFabric[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<FabricPriceTier[]>([]);

  useEffect(() => {
    getFabricPriceTiers()
      .then(setTiers)
      .catch((err) => console.error('Error loading fabric price tiers:', err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCharlotteFabrics()
      .then(setAllFabrics)
      .catch((err) => {
        console.error('Error loading Charlotte Fabrics catalog:', err);
        setError('Failed to load fabrics. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const activeTier = useMemo<FabricPriceTier | null>(() => {
    if (material) {
      const matched = tiers.find((t) => t.materials.includes(material));
      if (matched) return matched;
    }
    return tiers.find((t) => t.isDefault) || tiers[0] || null;
  }, [material, tiers]);

  const applicationOptions = useMemo(
    () => Array.from(new Set(allFabrics.flatMap((f) => f.applications))).sort(),
    [allFabrics]
  );
  const marketOptions = useMemo(
    () => Array.from(new Set(allFabrics.flatMap((f) => f.markets))).sort(),
    [allFabrics]
  );

  const filtered = useMemo(
    () => filterFabrics(allFabrics, { color, pattern, material, application, market }),
    [allFabrics, color, pattern, material, application, market]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [color, pattern, material, application, market]);

  const visibleFabrics = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

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
        <Grid item xs={12} sm={4} md={2.4}>
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
        <Grid item xs={12} sm={4} md={2.4}>
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
        <Grid item xs={12} sm={4} md={2.4}>
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
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Application"
            value={application}
            onChange={(e) => setApplication(e.target.value)}
          >
            <MenuItem value="">Any Application</MenuItem>
            {applicationOptions.map((a) => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Market"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          >
            <MenuItem value="">Any Market</MenuItem>
            {marketOptions.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Price hint for the currently active filter/tier */}
      {tiers.length > 0 && estimatedYards > 0 && (
        <Box sx={{ mb: 3, p: 1.5, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {material ? (
              <>
                Priced as <strong>{activeTier?.name}</strong> — ${activeTier?.pricePerYard.toFixed(2)}/yd × {estimatedYards} yd ≈{' '}
                <strong>${((activeTier?.pricePerYard || 0) * estimatedYards).toFixed(2)}</strong>
              </>
            ) : (
              <>
                No material filter selected — fabrics you pick will default to <strong>{activeTier?.name}</strong> pricing
                (${activeTier?.pricePerYard.toFixed(2)}/yd ≈ ${((activeTier?.pricePerYard || 0) * estimatedYards).toFixed(2)}).
                Filter by Material above for exact tier pricing.
              </>
            )}
          </Typography>
        </Box>
      )}

      {/* Selected fabric summary */}
      {selectedFabric && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, p: 2, bgcolor: 'rgba(227, 194, 154, 0.15)', border: '1px solid rgba(227, 194, 154, 0.6)', borderRadius: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 1, overflow: 'hidden', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}>
            <img src={selectedFabric.imageUrl} alt={selectedFabric.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Selected: {selectedFabric.name}</Typography>
          </Box>
          <Button size="small" onClick={() => onSelect(null, null)}>Clear</Button>
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
      ) : visibleFabrics.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
          No fabrics found for this combination of filters.
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {visibleFabrics.map((fabric) => {
              const fabricItem = toFabricItem(fabric);
              const isSelected = selectedFabric?.id === fabricItem.id;
              return (
                <Grid item xs={6} sm={4} md={3} key={fabricItem.id}>
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
                    onClick={() => onSelect(fabricItem, activeTier)}
                  >
                    <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: '#fff' }}>
                      {fabricItem.imageUrl ? (
                        <img src={fabricItem.imageUrl} alt={fabricItem.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        {fabricItem.name}
                      </Typography>
                      {(fabric.fiberContent || fabric.durability) && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                          {fabric.fiberContent || fabric.durability}
                        </Typography>
                      )}
                      {fabricItem.productUrl && (
                        <Box
                          component="a"
                          href={fabricItem.productUrl}
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
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Load More
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
