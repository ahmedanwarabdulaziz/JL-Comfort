'use client';

import {
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { Product } from '@/lib/types/product';

interface HomePageClientProps {
  products: Product[];
}

// Phase 1: Fabric-only launch. Only fabric-related categories shown.
const CATEGORIES = [
  {
    title: '✨ AI Fabric Visualizer',
    description: 'Upload a photo of your furniture and see it reimagined with any fabric — powered by Google Gemini AI.',
    image: '/images/ai-visualizer.png',
    link: '/visualizer',
    highlight: true,
  },
  {
    title: 'Shop Premium Fabrics',
    description: 'Browse our curated collection of luxurious upholstery fabrics — every style, every colour.',
    image: '/images/frame-fabric.png',
    link: '/fabrics',
  },
];

const trustPoints = [
  { icon: <AutoAwesomeIcon sx={{ fontSize: 20 }} />, label: 'AI-Powered Visualizer' },
  { icon: <VerifiedIcon sx={{ fontSize: 20 }} />, label: 'Premium Quality Fabrics' },
  { icon: <LocalShippingIcon sx={{ fontSize: 20 }} />, label: 'Fast, Reliable Shipping' },
];

export default function HomePageClient({ products }: HomePageClientProps) {
  const theme = useTheme();

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          background: 'linear-gradient(160deg, #171310 0%, #0a0908 50%, #000000 100%)',
          py: { xs: 8, md: 0 },
        }}
      >
        <Box sx={{ position: 'absolute', top: -100, left: '-5%', width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(227, 194, 154, 0.10)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -120, right: '10%', width: 360, height: 360, borderRadius: '50%', bgcolor: 'rgba(227, 194, 154, 0.08)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <Container maxWidth="xl" sx={{ position: 'relative' }}>
          <Grid container spacing={6} alignItems="center" sx={{ py: { xs: 2, md: 10 } }}>
            <Grid item xs={12} md={6}>
              <Typography variant="overline" sx={{ color: '#e3c29a', letterSpacing: 2, fontWeight: 'bold' }}>
                PREMIUM UPHOLSTERY FABRICS
              </Typography>
              <Typography variant="h2" component="h1" fontWeight="800" sx={{ mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                The Perfect Fabric, <span style={{ color: '#e3c29a' }}>For Every Style</span>
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)', fontWeight: 400, maxWidth: 480 }}>
                Discover our curated collection of premium upholstery fabrics. Visualize any fabric on your furniture in seconds with our AI-powered tool.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 5 }}>
                <Button
                  component={Link}
                  href="/fabrics"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: '#e3c29a',
                    color: '#000',
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.05rem',
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#d4b087' },
                  }}
                >
                  Browse Our Fabrics
                </Button>
                <Button
                  component={Link}
                  href="/visualizer"
                  variant="outlined"
                  size="large"
                  startIcon={<AutoAwesomeIcon />}
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.4)',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.05rem',
                    borderRadius: 2,
                    '&:hover': { borderColor: '#e3c29a', color: '#e3c29a', bgcolor: 'rgba(227, 194, 154, 0.08)' },
                  }}
                >
                  Try the AI Visualizer
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 4 } }}>
                {trustPoints.map((point) => (
                  <Box key={point.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: '#e3c29a', display: 'flex' }}>{point.icon}</Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                      {point.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid rgba(227, 194, 154, 0.25)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  maxWidth: 480,
                  mx: 'auto',
                }}
              >
                <img
                  src="/images/frame-fabric.png"
                  alt="Premium upholstery fabrics collection"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── FABRIC COLLECTIONS — light section to break the dark hero ── */}
      <Box sx={{ bgcolor: '#f8f5f1', py: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
            {/* Left: 2×2 fabric image mosaic */}
            <Grid item xs={12} md={7}>
              <Grid container spacing={1.5}>
                {[
                  { src: 'https://www.charlottefabrics.com/wp-content/uploads/Wisteria-Antique-Velvet-by-Charlotte-scaled.jpg', alt: 'Velvet fabric', label: 'Velvet' },
                  { src: 'https://www.charlottefabrics.com/wp-content/uploads/Maxwell-Blush-scaled.jpg', alt: 'Linen fabric', label: 'Linen' },
                  { src: 'https://www.charlottefabrics.com/wp-content/uploads/Sherpa-Cream-scaled.jpg', alt: 'Boucle fabric', label: 'Boucle' },
                  { src: 'https://www.charlottefabrics.com/wp-content/uploads/Ritz-Moss-Green-by-Charlotte-Fabrics-scaled.jpg', alt: 'Chenille fabric', label: 'Chenille' },
                ].map((img) => (
                  <Grid item xs={6} key={img.label}>
                    <Box
                      component={Link}
                      href="/fabrics"
                      sx={{
                        display: 'block',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        aspectRatio: '1/1',
                        position: 'relative',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                        '&:hover img': { transform: 'scale(1.06)' },
                        '&:hover .fabric-label': { opacity: 1 },
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s ease' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/frame-fabric.png'; }}
                      />
                      <Box
                        className="fabric-label"
                        sx={{
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0,
                          p: 1.5,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                          opacity: 0.85,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: 0.5 }}>
                          {img.label}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Right: Copy */}
            <Grid item xs={12} md={5}>
              <Typography variant="overline" sx={{ color: '#b8935f', letterSpacing: 2, fontWeight: 700, fontSize: '0.7rem' }}>
                Handpicked Collections
              </Typography>
              <Typography variant="h3" component="h2" sx={{ color: '#1a1a1a', fontWeight: 800, mt: 1, mb: 2, lineHeight: 1.2, fontSize: { xs: '1.9rem', md: '2.4rem' } }}>
                Thousands of fabrics,{' '}
                <Box component="span" sx={{ color: '#b8935f' }}>one destination</Box>
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', mb: 4, lineHeight: 1.8 }}>
                From performance velvets to textured bouclés — browse our full catalog by colour, pattern, or material. Every fabric priced per yard with free samples available.
              </Typography>

              {/* Material quick-links */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                {[
                  { label: 'Velvet', q: 'velvet' },
                  { label: 'Linen', q: 'linen' },
                  { label: 'Chenille', q: 'chenille' },
                  { label: 'Boucle', q: 'boucle' },
                  { label: 'Performance', q: 'crypton' },
                ].map((tag) => (
                  <Box
                    key={tag.q}
                    component={Link}
                    href={`/fabrics?material=${tag.q}`}
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.7,
                      borderRadius: '8px',
                      bgcolor: '#fff',
                      border: '1px solid rgba(0,0,0,0.12)',
                      color: '#444',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.18s ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      '&:hover': { borderColor: '#b8935f', color: '#b8935f', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
                    }}
                  >
                    {tag.label}
                  </Box>
                ))}
              </Box>

              <Button
                component={Link}
                href="/fabrics"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: '#1a1a1a',
                  color: '#e3c29a',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  borderRadius: '8px',
                  '&:hover': { bgcolor: '#333' },
                }}
              >
                Browse All Fabrics
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Categories Section */}
        <Box sx={{ mb: 10 }}>
          <Typography variant="h3" component="h2" align="center" fontWeight="700" gutterBottom>
            What We Offer
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 6 }}>
            Premium fabrics, beautifully visualized.
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            {CATEGORIES.map((category) => (
              <Grid item xs={12} sm={6} key={category.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: theme.shadows[8] },
                  }}
                >
                  <CardActionArea component={Link} href={category.link} sx={{ height: '100%' }}>
                    <CardMedia
                      component="img"
                      height="260"
                      image={category.image}
                      alt={category.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Typography gutterBottom variant="h5" component="h3" fontWeight="600">
                        {category.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {category.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Featured Products */}
        {products.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" component="h2" align="center" fontWeight="700" gutterBottom>
              Featured Products
            </Typography>
            <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 6 }}>
              Our top picks just for you.
            </Typography>

            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      transition: 'box-shadow 0.2s',
                      '&:hover': {
                        boxShadow: theme.shadows[6],
                      },
                    }}
                  >
                    <CardActionArea sx={{ flexGrow: 1 }}>
                      <CardMedia
                        component="div"
                        sx={{
                          height: 240,
                          backgroundColor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 2,
                        }}
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <Typography color="text.secondary">No Image</Typography>
                        )}
                      </CardMedia>
                      <CardContent>
                        <Typography variant="h6" component="h3" fontWeight="600" gutterBottom>
                          {product.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 2,
                          }}
                        >
                          {product.description}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#b8935f', fontWeight: 'bold' }}>
                          {product.price} {product.currency}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      {/* ── SAMPLE BOOKS SECTION ──────────────────────────────────── */}
      <Box sx={{ bgcolor: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)', py: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">

            {/* Left: copy */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1,
                  bgcolor: '#f5f0e8', borderRadius: '20px', px: 2, py: 0.6, mb: 2.5,
                }}
              >
                <AutoStoriesIcon sx={{ fontSize: 15, color: '#b8935f' }} />
                <Typography variant="caption" sx={{ color: '#b8935f', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.7rem' }}>
                  Physical Swatch Collections
                </Typography>
              </Box>

              <Typography variant="h3" component="h2" sx={{ color: '#1a1a1a', fontWeight: 800, mb: 2, lineHeight: 1.2, fontSize: { xs: '1.9rem', md: '2.3rem' } }}>
                Browse our{' '}
                <Box component="span" sx={{ color: '#b8935f' }}>Sample Books</Box>
              </Typography>

              <Typography variant="body1" sx={{ color: '#666', mb: 4, lineHeight: 1.8 }}>
                Our fabric collections are organized into curated sample books — just like you&apos;d find in a designer showroom. Browse a book, pick your favourites, and we&apos;ll ship free swatches straight to you.
              </Typography>

              {/* Step pills */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                {[
                  { n: '01', title: 'Browse a Collection', desc: "Find a sample book that matches your project style or colour palette." },
                  { n: '02', title: 'Pick Your Fabrics', desc: "Click through to the fabric shop, filtered to that book's collection." },
                  { n: '03', title: 'Request Free Swatches', desc: "Add fabrics to your sample cart and we'll ship swatches to your door free." },
                ].map((step) => (
                  <Box key={step.n} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Typography sx={{ color: '#b8935f', fontWeight: 900, fontSize: '0.75rem' }}>{step.n}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#555', fontWeight: 500 }}>{step.title}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  href="/sample-books"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ bgcolor: '#1a1a1a', color: '#e3c29a', fontWeight: 700, px: 4, py: 1.4, borderRadius: '8px', textTransform: 'none', '&:hover': { bgcolor: '#333' } }}
                >
                  Browse Collections
                </Button>
                <Button
                  component={Link}
                  href="/request-samples"
                  variant="outlined"
                  size="large"
                  sx={{ borderColor: 'rgba(0,0,0,0.2)', color: '#555', fontWeight: 600, px: 3, py: 1.4, borderRadius: '8px', textTransform: 'none', '&:hover': { borderColor: '#b8935f', color: '#b8935f', bgcolor: 'transparent' } }}
                >
                  Sample Cart
                </Button>
              </Box>
            </Grid>

            {/* Right: decorative book grid */}
            <Grid item xs={12} md={7}>
              <Grid container spacing={1.5}>
                {[
                  { bg: '#e8ddd0', label: 'Charlotte Colors', sub: 'Luxury solids & textures' },
                  { bg: '#d4c9b8', label: 'Performance Series', sub: 'Stain-resistant fabrics' },
                  { bg: '#c9bfb0', label: 'Woven Patterns', sub: 'Geometric & abstract' },
                  { bg: '#ddd6ca', label: 'Velvet Collection', sub: 'Plush & premium' },
                ].map((book, i) => (
                  <Grid item xs={6} key={i}>
                    <Box
                      component={Link}
                      href="/sample-books"
                      sx={{
                        bgcolor: book.bg,
                        borderRadius: '14px',
                        p: 2.5,
                        aspectRatio: '4/3',
                        textDecoration: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 28px rgba(0,0,0,0.14)' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <AutoStoriesIcon sx={{ fontSize: 28, color: 'rgba(0,0,0,0.15)' }} />
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: '#1a1a1a', fontSize: '0.85rem', lineHeight: 1.2 }}>
                        {book.label}
                      </Typography>
                      <Typography sx={{ color: 'rgba(0,0,0,0.55)', fontSize: '0.72rem', mt: 0.3 }}>
                        {book.sub}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>

          </Grid>
        </Container>
      </Box>
    </>
  );
}
