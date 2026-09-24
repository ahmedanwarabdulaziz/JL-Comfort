'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  Stack,
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from '@/lib/context/CartContext';
import { useSampleCart } from '@/lib/context/SampleCartContext';
import FabricPropertyIcons from './FabricPropertyIcons';

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
  features?: string;
  performance?: string;
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

const displayValue = (value?: string[]) => value?.filter(Boolean).join(' / ');

export default function FabricDetailClient({ fabric }: { fabric: FabricDetailData }) {
  const { addToCart, items } = useCart();
  const { items: sampleItems, addSample, isFull } = useSampleCart();
  const [yards, setYards] = useState(1);
  const [added, setAdded] = useState(false);
  const [sampleAdded, setSampleAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(fabric.imageUrl);

  const inStock = fabric.availability === 'InStock';
  const hasPrice = fabric.pricePerYard != null;
  const alreadySampled = sampleItems.some((i) => i.fabricId === fabric.id);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const rows = specRows(fabric);
  const gallery = [
    { id: fabric.id, name: fabric.name, imageUrl: fabric.imageUrl },
    ...fabric.colorwaySiblings.map((sibling) => ({ id: sibling.id, name: sibling.name, imageUrl: sibling.imageUrl })),
  ].filter((image) => image.imageUrl);

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
    setSampleAdded(true);
    setTimeout(() => setSampleAdded(false), 2000);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', pb: { xs: 8, md: 14 }, color: '#222' }}>
      <Box sx={{ borderBottom: '1px solid #e5e2dd', bgcolor: '#fbfaf8' }}>
        <Container maxWidth="xl" sx={{ py: 1.25 }}>
          <Button component={Link} href="/fabrics" startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />} sx={{ color: '#716b64', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1.5, p: 0.5, '&:hover': { bgcolor: 'transparent', color: '#a87945' } }}>
            All Fabrics
          </Button>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={{ xs: 5, md: 8 }}>
          <Grid item xs={12} md={7}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 92 } }}>
              <Box sx={{ bgcolor: '#f5f3f0', aspectRatio: '1 / 1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeImage} alt={fabric.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Typography sx={{ color: '#8c8882', letterSpacing: 1 }}>Image unavailable</Typography>
                )}
              </Box>

              {gallery.length > 0 && (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5, pb: 0.5 }}>
                  {gallery.map((image) => (
                    <Box key={image.id} component="button" type="button" onClick={() => setActiveImage(image.imageUrl)} aria-label={'View ' + image.name} sx={{ flex: '0 0 auto', width: { xs: 64, md: 76 }, height: { xs: 64, md: 76 }, p: 0, border: '1px solid', borderColor: activeImage === image.imageUrl ? '#8d6c4b' : '#e5e2dd', bgcolor: '#f5f3f0', cursor: 'pointer', overflow: 'hidden', opacity: activeImage === image.imageUrl ? 1 : 0.72, transition: 'all .2s ease', '&:hover': { opacity: 1, borderColor: '#8d6c4b' } }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ maxWidth: 520, pl: { md: 1 } }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}>
                {fabric.brand && <Chip label={fabric.brand} size="small" sx={{ bgcolor: '#f3ede5', color: '#795638', borderRadius: 0, textTransform: 'uppercase', letterSpacing: 1.1, fontSize: '0.62rem', fontWeight: 700 }} />}
                {fabric.performance && <Chip label={fabric.performance} size="small" sx={{ bgcolor: '#f7f7f6', color: '#77716b', borderRadius: 0, textTransform: 'uppercase', letterSpacing: 1.1, fontSize: '0.62rem', fontWeight: 700 }} />}
              </Stack>
              <Typography component="h1" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, lineHeight: 1.08, fontWeight: 400, letterSpacing: '-0.02em', color: '#252321', mb: 1 }}>{fabric.name}</Typography>
              <Typography sx={{ color: '#8b857e', fontSize: '0.76rem', letterSpacing: 1.3, textTransform: 'uppercase', mb: 3 }}>SKU {fabric.sku}</Typography>

              <Divider sx={{ borderColor: '#e5e2dd', mb: 2.5 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', borderBottom: '1px solid #e5e2dd', mb: 3 }}>
                {[
                  ['Status', inStock ? 'Current Pattern' : 'Unavailable'],
                  ['Availability', inStock ? 'In stock' : 'Out of stock'],
                  ['Collection', displayValue(fabric.sampleBooks) || fabric.brand || 'JL Comfort Collection'],
                  ['Color', displayValue(fabric.color) || 'N/A'],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ py: 1.5, pr: 1.5, borderTop: '1px solid #e5e2dd' }}>
                    <Typography sx={{ color: '#938d86', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: 1.2, mb: 0.45 }}>{label}</Typography>
                    <Typography sx={{ color: '#393532', fontSize: '0.9rem' }}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              {fabric.properties && fabric.properties.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ color: '#938d86', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: 1.2, mb: 1 }}>Features</Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {fabric.properties.slice(0, 5).map((property) => <Chip key={property} label={property} size="small" variant="outlined" sx={{ borderColor: '#d7d0c8', color: '#625b54', borderRadius: 0, fontSize: '0.7rem' }} />)}
                  </Stack>
                </Box>
              )}

              <FabricPropertyIcons fabric={fabric} />

              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: '#252321', fontSize: '1.2rem', fontWeight: 500 }}>
                    {hasPrice ? '$' + fabric.pricePerYard!.toFixed(2) + ' CAD' : 'Price on request'}
                    {hasPrice && <Typography component="span" sx={{ color: '#8b857e', fontSize: '0.78rem', ml: 0.75 }}>/ yard</Typography>}
                  </Typography>
                  {hasPrice && <Typography sx={{ color: '#8b857e', fontSize: '0.72rem' }}>Retail pricing</Typography>}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <ButtonGroup variant="outlined" sx={{ height: 48, '& .MuiButton-root': { minWidth: 42, borderColor: '#c9c2ba', color: '#393532', borderRadius: 0 } }}>
                    <Button onClick={() => setYards((y) => Math.max(1, y - 1))} disabled={yards <= 1} aria-label="Decrease quantity"><RemoveIcon fontSize="small" /></Button>
                    <Button disabled sx={{ px: 1.5, '&.Mui-disabled': { color: '#393532', fontWeight: 600 } }}>{yards}</Button>
                    <Button onClick={() => setYards((y) => y + 1)} aria-label="Increase quantity"><AddIcon fontSize="small" /></Button>
                  </ButtonGroup>
                  <Button variant="contained" fullWidth disabled={!hasPrice || !inStock} onClick={handleAddToCart} disableElevation sx={{ borderRadius: 0, bgcolor: '#252321', color: '#fff', fontSize: '0.75rem', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', '&:hover': { bgcolor: '#8d6c4b' }, '&.Mui-disabled': { bgcolor: '#ece9e6', color: '#aaa' } }}>
                    {added ? 'Added to Cart' : 'Add to Cart'}
                  </Button>
                </Box>
                <Button variant="outlined" fullWidth startIcon={alreadySampled ? <CheckCircleIcon /> : undefined} disabled={alreadySampled || (isFull && !alreadySampled)} onClick={handleRequestSample} sx={{ height: 48, borderColor: '#c9c2ba', color: '#393532', borderRadius: 0, fontSize: '0.75rem', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', '&:hover': { borderColor: '#8d6c4b', color: '#8d6c4b', bgcolor: '#fbfaf8' } }}>
                  {alreadySampled ? 'Sample Requested' : sampleAdded ? 'Added to Samples' : 'Request Free Sample'}
                </Button>
                {hasPrice && <Typography sx={{ color: '#938d86', fontSize: '0.7rem', textAlign: 'center', mt: 1 }}>Total: {'$' + (fabric.pricePerYard! * yards).toFixed(2)} CAD for {yards} yard{yards === 1 ? '' : 's'}</Typography>}
              </Box>

              {fabric.productUrl && (
                <Button component="a" href={fabric.productUrl} target="_blank" rel="noreferrer" endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />} sx={{ p: 0, color: '#8d6c4b', fontSize: '0.7rem', letterSpacing: 0.6, textTransform: 'uppercase', '&:hover': { bgcolor: 'transparent', color: '#252321' } }}>
                  View original Charlotte listing
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 8, md: 12 }, pt: { xs: 5, md: 7 }, borderTop: '1px solid #ded9d3' }}>
          <Grid container spacing={{ xs: 5, md: 10 }}>
            <Grid item xs={12} md={4}>
              <Typography sx={{ color: '#252321', fontSize: '1.35rem', fontWeight: 400, mb: 1 }}>Product Specs</Typography>
              <Typography sx={{ color: '#817a73', fontSize: '0.9rem', lineHeight: 1.7 }}>Detailed construction, care, and application information for {fabric.name}.</Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ borderTop: '1px solid #ded9d3' }}>
                {rows.map(([label, value]) => (
                  <Box key={label} sx={{ display: 'grid', gridTemplateColumns: { xs: '42% 58%', md: '32% 68%' }, gap: 2, py: 1.45, borderBottom: '1px solid #ded9d3' }}>
                    <Typography sx={{ color: '#817a73', fontSize: '0.68rem', letterSpacing: 1.05, textTransform: 'uppercase' }}>{label}</Typography>
                    <Typography sx={{ color: '#3f3a36', fontSize: '0.88rem', lineHeight: 1.55 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {fabric.colorwaySiblings.length > 0 && (
          <Box sx={{ mt: { xs: 8, md: 12 }, pt: { xs: 5, md: 7 }, borderTop: '1px solid #ded9d3' }}>
            <Typography sx={{ color: '#252321', fontSize: '1.35rem', fontWeight: 400, mb: 0.75 }}>Colorways</Typography>
            <Typography sx={{ color: '#817a73', fontSize: '0.9rem', mb: 3 }}>Explore more colors in this collection.</Typography>
            <Grid container spacing={2}>
              {fabric.colorwaySiblings.map((sibling) => (
                <Grid item xs={6} sm={4} md={2} key={sibling.id}>
                  <Box component={Link} href={'/fabrics/' + sibling.id} sx={{ color: 'inherit', textDecoration: 'none', display: 'block', '&:hover .colorway-image': { opacity: 0.82 } }}>
                    <Box className="colorway-image" sx={{ aspectRatio: '1 / 1', bgcolor: '#f5f3f0', overflow: 'hidden', transition: 'opacity .2s' }}>
                      {sibling.imageUrl && <img src={sibling.imageUrl} alt={sibling.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </Box>
                    <Typography sx={{ mt: 1, color: '#3f3a36', fontSize: '0.78rem', lineHeight: 1.35 }}>{sibling.name}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      <IconButton
        component={Link}
        href="/checkout"
        aria-label="Open cart"
        title="Open cart"
        sx={{
          position: 'fixed',
          right: { xs: 24, md: 24 },
          bottom: { xs: 104, md: 108 },
          zIndex: 1200,
          width: 54,
          height: 54,
          color: '#fff',
          bgcolor: '#252321',
          boxShadow: '0 8px 24px rgba(37,35,33,0.22)',
          '&:hover': { bgcolor: '#8d6c4b' },
        }}
      >
        <Badge badgeContent={itemCount} color="error" invisible={itemCount === 0}>
          <ShoppingCartOutlinedIcon />
        </Badge>
      </IconButton>
    </Box>
  );
}
