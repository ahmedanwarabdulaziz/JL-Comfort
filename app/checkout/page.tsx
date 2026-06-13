'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  List,
  ListItem,
  IconButton,
  ButtonGroup,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCart } from '@/lib/context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleStripeCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const session = await response.json();

      if (session.error) {
        console.error('Error from checkout session:', session.error);
        alert(`Checkout Error: ${session.error}. Please make sure you restarted the dev server after adding Stripe keys.`);
        setIsCheckingOut(false);
        return;
      }

      if (session.url) {
        window.location.href = session.url;
      } else {
        alert('Stripe redirect URL not found.');
        setIsCheckingOut(false);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(`Network Error: ${err.message}`);
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent' }}>
          <Typography variant="h5" gutterBottom color="text.secondary">
            Your cart is currently empty.
          </Typography>
          <Button component={Link} href="/foam" variant="contained" sx={{ mt: 2 }}>
            Start Customizing Foam
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Button
        component={Link}
        href="/foam"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 4 }}
      >
        Continue Shopping
      </Button>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Checkout
      </Typography>

      <Grid container spacing={4}>
        {/* Left Column: Cart Items */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List disablePadding>
              {items.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding sx={{ py: 3, display: 'block' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {item.categoryName} - {item.typeName}
                      </Typography>
                      <IconButton edge="end" onClick={() => removeFromCart(item.id)} sx={{ color: 'error.main' }}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body1" color="text.secondary" paragraph>
                          Dimensions: {item.dimensions.thickness}&quot; × {item.dimensions.rawDepth}&quot; × {item.dimensions.rawWidth}&quot;
                        </Typography>
                        {item.gradeName && (
                          <Typography variant="body2" color="text.secondary">
                            Grade: {item.gradeName}
                          </Typography>
                        )}
                        {item.wrapName && (
                          <Typography variant="body2" color="text.secondary">
                            Wrap: {item.wrapName}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, justifyContent: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>
                          ${item.totalPrice.toFixed(2)}
                        </Typography>
                        <ButtonGroup size="small" aria-label="quantity selector">
                          <Button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                            <RemoveIcon fontSize="small" />
                          </Button>
                          <Button disabled sx={{ color: 'text.primary', '&.Mui-disabled': { color: 'text.primary' } }}>
                            {item.quantity}
                          </Button>
                          <Button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <AddIcon fontSize="small" />
                          </Button>
                        </ButtonGroup>
                      </Grid>
                    </Grid>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Right Column: Order Total & Payment */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 24 }}>
            <Typography variant="h6" gutterBottom>
              Order Total
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>${cartTotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Shipping</Typography>
              <Typography>Calculated at next step</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Taxes</Typography>
              <Typography>Calculated at next step</Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Total</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                ${cartTotal.toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleStripeCheckout}
              disabled={isCheckingOut}
              sx={{ py: 1.5, fontSize: '1.1rem' }}
            >
              {isCheckingOut ? 'Processing...' : 'Pay with Stripe'}
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
              You will be redirected to Stripe&apos;s secure checkout to enter your payment and shipping details.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
