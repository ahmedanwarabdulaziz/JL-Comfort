'use client';

import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  ButtonGroup,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCart } from '@/lib/context/CartContext';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to set your publishable key in .env.local
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const theme = useTheme();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
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
        setIsCheckingOut(false);
        return;
      }

      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await (stripe as any).redirectToCheckout({
          sessionId: session.id,
        });

        if (error) {
          console.error('Stripe redirect error:', error);
          setIsCheckingOut(false);
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setIsCheckingOut(false);
    }
  };

  return (
    <Drawer anchor="right" open={isCartOpen} onClose={() => setIsCartOpen(false)}>
      <Box sx={{ width: { xs: 300, sm: 400 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6">Shopping Cart</Typography>
          <IconButton onClick={() => setIsCartOpen(false)} sx={{ color: 'inherit' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Cart Items */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          {items.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
              Your cart is empty.
            </Typography>
          ) : (
            <List disablePadding>
              {items.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding sx={{ py: 2, display: 'block' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.categoryName} - {item.typeName}
                      </Typography>
                      <IconButton edge="end" size="small" onClick={() => removeFromCart(item.id)} sx={{ color: 'error.main' }}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
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

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
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
                      <Typography variant="subtitle1" fontWeight="bold">
                        ${item.totalPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {items.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Subtotal</Typography>
              <Typography variant="h6" fontWeight="bold">
                ${cartTotal.toFixed(2)}
              </Typography>
            </Box>
            <Button
              component="a"
              href="/checkout"
              variant="contained"
              fullWidth
              size="large"
              onClick={() => setIsCartOpen(false)}
              sx={{ mb: 1, py: 1.5 }}
            >
              Proceed to Checkout
            </Button>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => setIsCartOpen(false)}
            >
              Continue Shopping
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
