'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Container,
  Dialog,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from '@/lib/context/CartContext';
import { useSampleCart } from '@/lib/context/SampleCartContext';
import { getShippingRate } from '@/lib/data/shippingRates';
import { ShippingRate } from '@/lib/types/checkout';
import { brand } from '@/lib/theme';
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

// Shared look for this page: brand ink/mocha/chalk, Work Sans labels, Fraunces headings.
const LINE = '#e5e0d9';
const MUTED = '#8b857e';
const labelSx = { color: MUTED, fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const };

// Catalog facet values are slugs ("small-scale", "woven-patterns"); show them as words.
const words = (values?: string[]) =>
  (values || []).map((v) => v.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ');

const specRows = (fabric: FabricDetailData, pattern: string): [string, string][] => {
  const rows: [string, string | undefined][] = [
    ['Pattern number', pattern || fabric.sku],
    ['Style', words(fabric.pattern)],
    ['Type', words(fabric.material)],
    ['Colour', words(fabric.color)],
    ['Collection', fabric.sampleBooks?.join(', ')],
    ['Content', fabric.fiberContent],
    ['Width', fabric.width],
    ['Repeat', fabric.repeat],
    ['Pattern direction', fabric.patternDirection],
    ['Durability', fabric.durability],
    ['Cleaning', fabric.cleanability],
    ['Flammability', fabric.flammability],
    ['Country of origin', fabric.origin],
    ['Use', fabric.applications.join(', ')],
    ['Construction', fabric.constructionType?.join(', ')],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]);
};

/** "D2144 Wedgewood Scales" -> { pattern: "D2144", colourway: "Wedgewood Scales" }. */
const splitName = (name: string, sku: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  if (rest.length > 0 && /\d/.test(first)) return { pattern: first, colourway: rest.join(' ') };
  return { pattern: sku && sku !== name ? sku : '', colourway: name };
};

const cleanBookName = (name: string) => name.replace(/\s*&\s*Ring Book Page\s*#?\s*\w+\s*$/i, '').trim();

export default function FabricDetailClient({ fabric }: { fabric: FabricDetailData }) {
  const { addToCart, items } = useCart();
  const { items: sampleItems, addSample, isFull, settings: sampleSettings } = useSampleCart();
  const [yards, setYards] = useState(1);
  const [added, setAdded] = useState(false);
  const [sampleAdded, setSampleAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(fabric.imageUrl);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [shipping, setShipping] = useState<ShippingRate | null>(null);

  useEffect(() => {
    getShippingRate('CA').then(setShipping).catch(() => {});
  }, []);

  const inStock = fabric.availability === 'InStock';
  const hasPrice = fabric.pricePerYard != null;
  const alreadySampled = sampleItems.some((i) => i.fabricId === fabric.id);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { pattern, colourway } = splitName(fabric.name, fabric.sku);
  const collections = (fabric.sampleBooks || []).map((book) => ({ raw: book, label: cleanBookName(book) })).filter((b) => b.label);
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

  const style = words(fabric.pattern).toLowerCase();
  const type = words(fabric.material).toLowerCase();
  const description = [
    `${colourway}${pattern ? ` (${pattern})` : ''} is sold by the yard${collections[0] ? ` and belongs to our ${collections[0].label} collection` : ''}.`,
    style || type ? `Style: ${[style, type].filter(Boolean).join(', ')}.` : '',
    fabric.fiberContent ? `Content: ${fabric.fiberContent}.` : '',
    fabric.applications.length ? `Suited to ${fabric.applications.join(', ').toLowerCase()}.` : '',
    fabric.durability ? `Durability: ${fabric.durability}.` : '',
    fabric.cleanability ? `Care: ${fabric.cleanability}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', pb: { xs: 8, md: 14 }, color: brand.ink }}>
      <Box sx={{ borderBottom: `1px solid ${LINE}`, bgcolor: brand.chalk }}>
        <Container maxWidth="xl" sx={{ py: 1.25 }}>
          <Button component={Link} href="/fabrics" startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />} sx={{ color: MUTED, fontSize: '0.68rem', p: 0.5, '&:hover': { bgcolor: 'transparent', color: brand.mocha } }}>
            All fabrics
          </Button>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' }, gap: { xs: 4, md: 7 } }}>
          {/* ── Image ─────────────────────────────────────────────── */}
          <Box sx={{ position: { md: 'sticky' }, top: { md: 92 }, alignSelf: 'start' }}>
            <Box
              component="button"
              type="button"
              onClick={() => activeImage && setZoomOpen(true)}
              aria-label="Enlarge image"
              sx={{ position: 'relative', display: 'block', width: '100%', p: 0, border: 0, cursor: activeImage ? 'zoom-in' : 'default', bgcolor: '#f5f3f0', aspectRatio: '1 / 1', overflow: 'hidden', '&:hover .zoom-hint': { opacity: 1 } }}
            >
              {activeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeImage} alt={fabric.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <Typography sx={{ color: MUTED }}>Image unavailable</Typography>
              )}
              {activeImage && (
                <Box className="zoom-hint" sx={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.6, bgcolor: 'rgba(33,23,18,0.72)', color: brand.chalk, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85, transition: 'opacity .2s' }}>
                  <ZoomInIcon sx={{ fontSize: 16 }} /> Click to enlarge
                </Box>
              )}
            </Box>
            <Typography sx={{ color: MUTED, fontSize: '0.75rem', mt: 1, fontStyle: 'italic' }}>Colour and scale may not be an exact depiction.</Typography>

            {gallery.length > 1 && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                {gallery.map((image) => (
                  <Box key={image.id} component="button" type="button" onClick={() => setActiveImage(image.imageUrl)} aria-label={'View ' + image.name} sx={{ width: { xs: 60, md: 72 }, height: { xs: 60, md: 72 }, p: 0, border: '1px solid', borderColor: activeImage === image.imageUrl ? brand.mocha : LINE, bgcolor: '#f5f3f0', cursor: 'pointer', overflow: 'hidden', opacity: activeImage === image.imageUrl ? 1 : 0.72, transition: 'all .2s ease', '&:hover': { opacity: 1, borderColor: brand.mocha } }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* ── Details ───────────────────────────────────────────── */}
          <Box sx={{ maxWidth: 520 }}>
            {/* Stacked title: house, pattern, colour, collection */}
            <Typography sx={{ ...labelSx, color: brand.mocha, mb: 1 }}>JL Comfort</Typography>
            {pattern && (
              <Typography sx={{ fontSize: { xs: '1.05rem', md: '1.2rem' }, fontWeight: 600, letterSpacing: '0.06em', color: brand.ink }}>{pattern}</Typography>
            )}
            <Typography component="h1" variant="h1" sx={{ fontSize: { xs: '2.1rem', md: '2.8rem' }, lineHeight: 1.08, color: brand.ink, mt: 0.25 }}>
              {colourway}{' '}
              <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.mocha }}>Fabric</Box>
            </Typography>
            {collections.length > 0 && (
              <Typography sx={{ mt: 1, color: brand.textSecondary, fontSize: '0.92rem' }}>
                {collections.map((book, i) => (
                  <span key={book.raw}>
                    {i > 0 && ', '}
                    <Box component={Link} href={`/fabrics?sampleBook=${encodeURIComponent(book.raw)}`} sx={{ color: 'inherit', textDecorationColor: LINE, '&:hover': { color: brand.mocha } }}>
                      {book.label}
                    </Box>
                  </span>
                ))}{' '}
                Collection
              </Typography>
            )}

            {/* Price block */}
            <Box sx={{ mt: 3, border: `1px solid ${LINE}` }}>
              <Box sx={{ px: 2.5, py: 2, bgcolor: brand.chalk, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                <Box>
                  <Typography sx={labelSx}>Sample</Typography>
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: brand.ink }}>Free</Typography>
                </Box>
                <Typography sx={{ color: brand.mocha, fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'right' }}>Sample recommended</Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${LINE}` }}>
                <Typography sx={labelSx}>Product details</Typography>
                <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: brand.ink, mt: 0.25 }}>
                  {hasPrice ? `$${fabric.pricePerYard!.toFixed(2)} CAD` : 'Price on request'}
                  {hasPrice && <Box component="span" sx={{ fontSize: '0.85rem', fontWeight: 400, color: MUTED, ml: 0.75 }}>per yard</Box>}
                </Typography>
                <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.25, color: brand.textSecondary, fontSize: '0.85rem', lineHeight: 1.8 }}>
                  <li>Sold in 1 yard increments</li>
                  {shipping?.freeShippingOver != null ? (
                    <li>Free shipping on orders over ${shipping.freeShippingOver.toFixed(0)} CAD</li>
                  ) : (
                    <li>Shipping and tax calculated at checkout</li>
                  )}
                  <li>{inStock ? 'In stock' : 'Currently out of stock'}</li>
                </Box>
              </Box>
            </Box>

            {/* Actions */}
            <Button
              variant="outlined"
              fullWidth
              startIcon={alreadySampled ? <CheckCircleIcon /> : undefined}
              disabled={alreadySampled || (isFull && !alreadySampled) || !sampleSettings.requestsEnabled}
              onClick={handleRequestSample}
              sx={{ mt: 2.5, height: 52, borderColor: brand.ink, color: brand.ink, borderWidth: 1.5, fontSize: '0.8rem', '&:hover': { borderColor: brand.mocha, color: brand.mocha, bgcolor: brand.chalk, borderWidth: 1.5 } }}
            >
              {alreadySampled ? 'Sample in your list' : sampleAdded ? 'Added to samples' : 'Order free sample'}
            </Button>
            {alreadySampled && (
              <Typography sx={{ textAlign: 'center', mt: 0.75, fontSize: '0.78rem' }}>
                <Box component={Link} href="/request-samples" sx={{ color: brand.mocha }}>Review your sample request</Box>
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 1.25 }}>
              <ButtonGroup variant="outlined" sx={{ height: 52, '& .MuiButton-root': { minWidth: 42, borderColor: '#c9c2ba', color: brand.ink } }}>
                <Button onClick={() => setYards((y) => Math.max(1, y - 1))} disabled={yards <= 1} aria-label="Fewer yards"><RemoveIcon fontSize="small" /></Button>
                <Button disabled sx={{ px: 1.5, minWidth: 64, '&.Mui-disabled': { color: brand.ink, fontWeight: 600 } }}>{yards} yd</Button>
                <Button onClick={() => setYards((y) => y + 1)} aria-label="More yards"><AddIcon fontSize="small" /></Button>
              </ButtonGroup>
              <Button
                variant="contained"
                fullWidth
                disabled={!hasPrice || !inStock}
                onClick={handleAddToCart}
                disableElevation
                sx={{ height: 52, bgcolor: brand.ink, color: brand.chalk, fontSize: '0.8rem', '&:hover': { bgcolor: brand.mocha }, '&.Mui-disabled': { bgcolor: '#ece9e6', color: '#aaa' } }}
              >
                {added ? 'Added to cart' : 'Order product'}
              </Button>
            </Box>
            {hasPrice && (
              <Typography sx={{ color: MUTED, fontSize: '0.78rem', textAlign: 'right', mt: 0.75 }}>
                {yards} yard{yards === 1 ? '' : 's'} · ${(fabric.pricePerYard! * yards).toFixed(2)} CAD
              </Typography>
            )}

            {/* Alternative colourways */}
            {fabric.colorwaySiblings.length > 0 && (
              <Box sx={{ mt: 3.5 }}>
                <Typography sx={{ ...labelSx, mb: 1.25 }}>Alternative colourways</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 1.25 }}>
                  {fabric.colorwaySiblings.map((sibling) => (
                    <Box key={sibling.id} component={Link} href={'/fabrics/' + sibling.id} sx={{ color: 'inherit', textDecoration: 'none', '&:hover .cw': { borderColor: brand.mocha } }}>
                      <Box className="cw" sx={{ aspectRatio: '1 / 1', bgcolor: '#f5f3f0', overflow: 'hidden', border: `1px solid ${LINE}`, transition: 'border-color .2s' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {sibling.imageUrl && <img src={sibling.imageUrl} alt={sibling.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </Box>
                      <Typography sx={{ mt: 0.5, fontSize: '0.72rem', lineHeight: 1.3, color: brand.textSecondary }}>{splitName(sibling.name, '').colourway}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3.5 }}>
              <FabricPropertyIcons fabric={fabric} />
            </Box>
          </Box>
        </Box>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <Box sx={{ mt: { xs: 6, md: 9 }, borderTop: `1px solid ${LINE}` }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ borderBottom: `1px solid ${LINE}`, '& .MuiTab-root': { color: MUTED, fontSize: '0.78rem', minHeight: 56 }, '& .Mui-selected': { color: `${brand.ink} !important` }, '& .MuiTabs-indicator': { bgcolor: brand.mocha, height: 2 } }}
          >
            <Tab label="Specifications" />
            <Tab label="Description" />
            <Tab label="Samples" />
            <Tab label="Shipping" />
          </Tabs>

          <Box sx={{ py: { xs: 3, md: 4 }, maxWidth: 860 }}>
            {tab === 0 && (
              <Box sx={{ borderTop: `1px solid ${LINE}` }}>
                {specRows(fabric, pattern).map(([label, value]) => (
                  <Box key={label} sx={{ display: 'grid', gridTemplateColumns: { xs: '40% 60%', md: '30% 70%' }, gap: 2, py: 1.4, borderBottom: `1px solid ${LINE}` }}>
                    <Typography sx={labelSx}>{label}</Typography>
                    <Typography sx={{ color: brand.ink, fontSize: '0.9rem', lineHeight: 1.55 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            {tab === 1 && (
              <Box>
                <Typography sx={{ color: brand.textSecondary, lineHeight: 1.8, fontSize: '0.95rem' }}>{description}</Typography>
                {fabric.properties && fabric.properties.length > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                    {fabric.properties.map((property) => (
                      <Chip key={property} label={property} size="small" variant="outlined" sx={{ borderColor: LINE, color: brand.textSecondary, borderRadius: 0 }} />
                    ))}
                  </Stack>
                )}
              </Box>
            )}
            {tab === 2 && (
              <Typography component="div" sx={{ color: brand.textSecondary, lineHeight: 1.8, fontSize: '0.95rem' }}>
                <p style={{ marginTop: 0 }}>
                  Samples are free. We recommend ordering one before buying yardage: screens show colour and scale differently, and a
                  swatch lets you see the texture and colour in your own light.
                </p>
                <p>
                  You can request up to {sampleSettings.maxPerRequest} samples at a time, and up to {sampleSettings.maxPerCustomer} every{' '}
                  {sampleSettings.periodDays} days. We email you a tracking number as soon as your samples ship.
                </p>
              </Typography>
            )}
            {tab === 3 && (
              <Typography component="div" sx={{ color: brand.textSecondary, lineHeight: 1.8, fontSize: '0.95rem' }}>
                <p style={{ marginTop: 0 }}>
                  We ship across Canada. Shipping and tax are shown before you pay, once you enter your delivery address.
                  {shipping?.freeShippingOver != null && ` Orders over $${shipping.freeShippingOver.toFixed(0)} CAD ship free.`}
                </p>
                <p>
                  Fabric is cut to order and usually arrives within {shipping ? `${shipping.deliveryMinDays}–${shipping.deliveryMaxDays}` : 'a few'} business
                  days of shipping. You&apos;ll get a tracking number by email when it ships. Cut fabric is made to order, so please order a sample first if
                  you&apos;re unsure about the colour.
                </p>
              </Typography>
            )}
          </Box>
        </Box>
      </Container>

      {/* Enlarged image */}
      <Dialog open={zoomOpen} onClose={() => setZoomOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: '#111', borderRadius: 0 } }}>
        <IconButton onClick={() => setZoomOpen(false)} aria-label="Close" sx={{ position: 'absolute', right: 8, top: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
          <CloseIcon />
        </IconButton>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {activeImage && <img src={activeImage} alt={fabric.name} style={{ width: '100%', maxHeight: '88vh', objectFit: 'contain', display: 'block' }} />}
      </Dialog>

      <IconButton
        component={Link}
        href="/checkout"
        aria-label="Open cart"
        title="Open cart"
        sx={{
          position: 'fixed',
          right: 24,
          bottom: { xs: 104, md: 108 },
          zIndex: 1200,
          width: 54,
          height: 54,
          color: '#fff',
          bgcolor: brand.ink,
          boxShadow: '0 8px 24px rgba(37,35,33,0.22)',
          '&:hover': { bgcolor: brand.mocha },
        }}
      >
        <Badge badgeContent={itemCount} color="error" invisible={itemCount === 0}>
          <ShoppingCartOutlinedIcon />
        </Badge>
      </IconButton>
    </Box>
  );
}
