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
} from '@mui/material';
import Link from 'next/link';
import { Product } from '@/lib/types/product';

interface HomePageClientProps {
  products: Product[];
}

export default function HomePageClient({ products }: HomePageClientProps) {
  const router = useRouter();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            JL Comfort
          </Typography>
          <Button color="inherit" component={Link} href="/admin">
            Admin
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            mb: 6,
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            Welcome to JL Comfort
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Discover our amazing products
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              href="/foam"
            >
              Foam
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                // TODO: Navigate to products page in Milestone 2
              }}
            >
              Shop Now
            </Button>
          </Box>
        </Box>

        {/* Featured Products */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Featured Products
          </Typography>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      backgroundColor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    ) : (
                      <Typography color="text.secondary">
                        No Image
                      </Typography>
                    )}
                  </CardMedia>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
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
                        mb: 1,
                      }}
                    >
                      {product.description}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {product.price} {product.currency}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => {
                        // TODO: Navigate to product detail page in Milestone 2
                      }}
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  );
}
