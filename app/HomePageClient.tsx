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
  Chip,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StraightenIcon from '@mui/icons-material/Straighten';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { Product } from '@/lib/types/product';

interface HomePageClientProps {
  products: Product[];
}

const CATEGORIES = [
  {
    title: '✨ AI Fabric Visualizer',
    description: 'Upload a photo of your furniture and see it reimagined with any fabric — powered by Google Gemini AI.',
    image: '/images/ai-visualizer.png',
    link: '/visualizer',
    highlight: true,
  },
  {
    title: 'High-Quality Foam',
    description: 'Premium NeoGel foam cut to your exact specifications.',
    image: '/images/foam.png',
    link: '/foam',
  },
  {
    title: 'Bench Cushions',
    description: 'Custom, comfortable bench cushions for any space.',
    image: '/images/bench-cushions.png',
    link: '/bench-cushions',
    comingSoon: true,
  },
  {
    title: 'Fabric Care',
    description: 'Easy-to-use fabric care and cleaning solutions for your home.',
    image: '/images/fabric-care.png',
    link: '/fabric-care',
    comingSoon: true,
  },
  {
    title: 'Frame Fabric',
    description: 'Luxurious fabrics for all your upholstery needs.',
    image: '/images/frame-fabric.png',
    link: '/frame-fabric',
    comingSoon: true,
  },
  {
    title: 'Upholstery Tools',
    description: 'Professional-grade tools to make your upholstery projects a breeze.',
    image: '/images/upholstery-tools.png',
    link: '/upholstery-tools',
    comingSoon: true,
  },
];

const trustPoints = [
  { icon: <StraightenIcon sx={{ fontSize: 20 }} />, label: 'Cut to Your Exact Size' },
  { icon: <VerifiedIcon sx={{ fontSize: 20 }} />, label: 'Premium NeoGel Foam' },
  { icon: <LocalShippingIcon sx={{ fontSize: 20 }} />, label: 'Ships in 3–5 Business Days' },
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
                CUSTOM FOAM & UPHOLSTERY
              </Typography>
              <Typography variant="h2" component="h1" fontWeight="800" sx={{ mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                Comfort, Cut to <span style={{ color: '#e3c29a' }}>Your Exact Size</span>
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)', fontWeight: 400, maxWidth: 480 }}>
                Design your perfect cushion in minutes with premium NeoGel High-Density foam — no compromise sizes, no trimming required.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 5 }}>
                <Button
                  component={Link}
                  href="/foam"
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
                  Start Your Foam Order
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
                  src="/images/foam.png"
                  alt="Stack of premium NeoGel High-Density foam blocks"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Categories Section */}
        <Box sx={{ mb: 10 }}>
          <Typography variant="h3" component="h2" align="center" fontWeight="700" gutterBottom>
            Shop by Category
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 6 }}>
            Discover everything you need for the perfect finish.
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            {CATEGORIES.map((category) => {
              const cardInner = (
                <>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="260"
                      image={category.image}
                      alt={category.title}
                      sx={{ objectFit: 'cover', filter: category.comingSoon ? 'grayscale(60%)' : 'none' }}
                    />
                    {category.comingSoon && (
                      <Chip
                        label="Coming Soon"
                        size="small"
                        sx={{ position: 'absolute', top: 12, right: 12, bgcolor: '#000', color: '#e3c29a', fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography gutterBottom variant="h5" component="h3" fontWeight="600">
                      {category.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {category.description}
                    </Typography>
                  </CardContent>
                </>
              );

              return (
                <Grid item xs={12} sm={6} md={4} key={category.title}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      opacity: category.comingSoon ? 0.75 : 1,
                      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': category.comingSoon
                        ? {}
                        : { transform: 'translateY(-8px)', boxShadow: theme.shadows[8] },
                    }}
                  >
                    {category.comingSoon ? (
                      <Box sx={{ cursor: 'default' }}>{cardInner}</Box>
                    ) : (
                      <CardActionArea component={Link} href={category.link} sx={{ height: '100%' }}>
                        {cardInner}
                      </CardActionArea>
                    )}
                  </Card>
                </Grid>
              );
            })}
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
    </>
  );
}
