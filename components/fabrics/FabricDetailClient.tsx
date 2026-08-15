'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
  Button,
  ButtonGroup,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCart } from '@/lib/context/CartContext';
import { useSampleCart, MAX_SAMPLE_ITEMS } from '@/lib/context/SampleCartContext';

export interface ColorwaySibling {
  id: string;
  name: string;
  imageUrl: string;
  color: string[];
}

export interface FabricDetailData {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  productUrl: string;
  color: string[];
  pattern: string[];
  material: string[];
  applications: string[];
  markets: string[];
  fiberContent?: string;
  durability?: string;
  width?: string;
  repeat?: string;
  patternDirection?: string;
  cleanability?: string;
  flammability?: string;
  origin?: string;
  brand?: string;
  sampleBooks?: string[];
  ecoFriendly?: string[];
  constructionType?: string[];
  properties?: string[];
  availability: 'InStock' | 'OutOfStock';
  pricePerYard: number | null;
  priceTagName: string | null;
  colorwaySiblings: ColorwaySibling[];
}

const specRows = (fabric: FabricDetailData): [string, string][] => {
  const rows: [string, string | undefined][] = [
    ['Fiber Content', fabric.fiberContent],
    ['Durability', fabric.durability],
    ['Width', fabric.width],
    ['Repeat', fabric.repeat],
    ['Pattern Direction', fabric.patternDirection],
    ['Cleanability', fabric.cleanability],
    ['Flammability', fabric.flammability],
    ['Origin', fabric.origin],
    ['Applications', fabric.applications.join(', ')],
    ['Markets', fabric.markets.join(', ')],
    ['Construction Type', fabric.constructionType?.join(', ')],
    ['Sample Book(s)', fabric.sampleBooks?.join(', ')],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]);
};

export default function FabricDetailClient({ fabric }: { fabric: FabricDetailData }) {
  const { addToCart } = useCart();
  const { items: sampleItems, addSample, isFull } = useSampleCart();
  const [yards, setYards] = useState(1);
  const [added, setAdded] = useState(false);

  const inStock = fabric.availability === 'InStock';
  const hasPrice = fabric.pricePerYard != null;
  const alreadySampled = sampleItems.some((i) => i.fabricId === fabric.id);

  const handleAddToCart = () => {
    if (!hasPrice) return;
    addToCart({
      productType: 'fabric',
      fabricId: fabric.id,
      fabricSku: fabric.sku,
      fabricName: fabric.name,
      fabricImageUrl: fabric.imageUrl,
      quantity: yards,
      unitPrice: fabric.pricePerYard!,
      totalPrice: fabric.pricePerYard! * yards,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleRequestSample = () => {
    addSample({ fabricId: fabric.id, name: fabric.name, sku: fabric.sku, imageUrl: fabric.imageUrl });
  };

  const rows = specRows(fabric);
  const badges = [...(fabric.ecoFriendly || []), ...(fabric.properties || [])];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Button component={Link} href="/fabrics" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
          Back to Fabrics
        </Button>

        <Grid container spacing={5}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                width: '100%',
                aspectRatio: '1 / 1',
                bgcolor: '#fff',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {fabric.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fabric.imageUrl} alt={fabric.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No Image</Typography>
                </Box>
              )}
            </Box>

            {fabric.colorwaySiblings.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Also available in these colors
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {fabric.colorwaySiblings.map((sibling) => (
                    <Box
                      key={sibling.id}
                      component={Link}
                      href={`/fabrics/${sibling.id}`}
                      title={sibling.name}
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor: 'divider',
                        display: 'block',
                        '&:hover': { borderColor: '#e3c29a' },
                      }}
                    >
                      {sibling.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sibling.imageUrl} alt={sibling.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            {fabric.brand && <Chip label={fabric.brand} size="small" sx={{ mb: 1.5 }} />}
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {fabric.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              SKU: {fabric.sku}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <Chip
                size="small"
                label={inStock ? 'In Stock' : 'Out of Stock'}
                color={inStock ? 'success' : 'default'}
              />
              {fabric.priceTagName && <Chip size="small" variant="outlined" label={fabric.priceTagName} />}
            </Stack>

            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#b8935f' }}>
              {hasPrice ? `$${fabric.pricePerYard!.toFixed(2)} / yard` : 'Price on request'}
            </Typography>

            {badges.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                {badges.map((b) => (
                  <Chip key={b} label={b} size="small" variant="outlined" sx={{ borderColor: '#e3c29a' }} />
                ))}
              </Stack>
            )}

            <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Buy by the yard
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <ButtonGroup size="small" aria-label="yard quantity">
                  <Button onClick={() => setYards((y) => Math.max(1, y - 1))} disabled={yards <= 1}>
                    <RemoveIcon fontSize="small" />
                  </Button>
                  <Button disabled sx={{ color: 'text.primary', '&.Mui-disabled': { color: 'text.primary' } }}>
                    {yards} yd
                  </Button>
                  <Button onClick={() => setYards((y) => y + 1)}>
                    <AddIcon fontSize="small" />
                  </Button>
                </ButtonGroup>
                <Button
                  variant="contained"
                  disabled={!hasPrice || !inStock}
                  onClick={handleAddToCart}
                  sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#222' }, flexGrow: 1 }}
                >
                  {added ? 'Added!' : 'Add to Cart'}
                </Button>
              </Stack>
              {hasPrice && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Total: ${(fabric.pricePerYard! * yards).toFixed(2)} for {yards} yard{yards === 1 ? '' : 's'}
                </Typography>
              )}
            </Paper>

            <Button
              variant="outlined"
              fullWidth
              startIcon={alreadySampled ? <CheckCircleIcon /> : undefined}
              disabled={alreadySampled || (isFull && !alreadySampled)}
              onClick={handleRequestSample}
              sx={{ mb: 1, borderColor: '#e3c29a', color: '#8a6d3b', '&:hover': { borderColor: '#b8935f' } }}
            >
              {alreadySampled ? 'Sample Requested' : isFull ? `Sample list full (max ${MAX_SAMPLE_ITEMS})` : 'Request Free Sample'}
            </Button>
            {sampleItems.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {sampleItems.length} sample{sampleItems.length === 1 ? '' : 's'} selected —{' '}
                <Link href="/request-samples">review and submit</Link>
              </Typography>
            )}

            {fabric.productUrl && (
              <Box
                component="a"
                href={fabric.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 2, color: 'text.secondary', textDecoration: 'none', fontSize: '0.8rem', '&:hover': { color: '#000' } }}
              >
                View manufacturer page <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Box>
            )}
          </Grid>
        </Grid>

        {rows.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Product Specs
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableBody>
                  {rows.map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell sx={{ fontWeight: 'bold', width: '30%', bgcolor: '#fafafa' }}>{label}</TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}
