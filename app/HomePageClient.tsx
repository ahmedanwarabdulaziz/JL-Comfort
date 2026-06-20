'use client';

import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  CardActionArea,
  useTheme,
  alpha,
} from '@mui/material';
import Link from 'next/link';
import { Product } from '@/lib/types/product';

interface HomePageClientProps {
  products: Product[];
}

const CATEGORIES = [
  {
    title: 'High-Quality Foam',
    description: 'Premium upholstery foam cut to your exact specifications.',
    image: '/images/foam.png',
    link: '/foam',
  },
  {
    title: 'Bench Cushions',
    description: 'Custom, comfortable bench cushions for any space.',
    image: '/images/bench-cushions.png',
    link: '/bench-cushions', // Placeholder link
  },
  {
    title: 'Fabric Care',
    description: 'Easy-to-use fabric care and cleaning solutions for your home.',
    image: '/images/fabric-care.png',
    link: '/fabric-care', // Placeholder link
  },
  {
    title: 'Frame Fabric',
    description: 'Luxurious fabrics for all your upholstery needs.',
    image: '/images/frame-fabric.png',
    link: '/frame-fabric', // Placeholder link
  },
  {
    title: 'Upholstery Tools',
    description: 'Professional-grade tools to make your upholstery projects a breeze.',
    image: '/images/upholstery-tools.png',
    link: '/upholstery-tools', // Placeholder link
  },
];

export default function HomePageClient({ products }: HomePageClientProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>
            JL Comfort
          </Typography>
          <Button color="inherit" component={Link} href="/admin">
            Admin
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          backgroundColor: theme.palette.grey[900],
          color: 'common.white',
          py: { xs: 8, md: 16 },
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h2" component="h1" fontWeight="800" gutterBottom sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Elevate Your Comfort
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, fontWeight: 300 }}>
            Premium upholstery, custom foam, and luxurious fabrics for your next project.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 2 }}
            >
              Shop Collection
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 2, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'grey.300', backgroundColor: alpha('#fff', 0.1) } }}
            >
              Learn More
            </Button>
          </Box>
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
            {CATEGORIES.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.title}>
                <Card
                  elevation={0}
                  sx={{ 
                    height: '100%', 
                    borderRadius: 3,
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                    }
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
                      boxShadow: theme.shadows[6]
                    }
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
                        p: 2
                      }}
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <Typography color="text.secondary">
                          No Image
                        </Typography>
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
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {product.price} {product.currency}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  );
}
