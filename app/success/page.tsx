'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useCart } from '@/lib/context/CartContext';
import Link from 'next/link';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    // If we have a successful session, clear the cart
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);

  // Confirms the order with Stripe server-side (a backup to the webhook) and fetches its number.
  useEffect(() => {
    if (!sessionId) return;
    fetch('/api/orders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((response) => response.json())
      .then((data) => setOrderNumber(data.orderNumber || null))
      .catch(() => {});
  }, [sessionId]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Payment Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Thank you for your purchase. Your order{orderNumber ? <> <strong>{orderNumber}</strong></> : null} has been received and is being prepared.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          A confirmation with your order number is on its way to your inbox, and we&apos;ll email you a
          tracking number as soon as it ships.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          onClick={() => { window.location.href = '/'; }}
        >
          Return to Home
        </Button>
      </Paper>
    </Container>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    }>
      <SuccessContent />
    </Suspense>
  );
}
