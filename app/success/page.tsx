'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useCart } from '@/lib/context/CartContext';
import Link from 'next/link';
import { trackPurchase } from '@/lib/analytics/track';
import { readConsent } from '@/lib/consent';

// Reloading or revisiting the success page must not count the sale a second time in the ad platforms.
function reportPurchaseOnce(
  sessionId: string,
  data: { orderNumber?: string; totalCents: number; taxCents?: number | null; sha256Email?: string | null }
) {
  const key = `jl_purchase_tracked_${sessionId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch {
    // Storage blocked: still report once for this page view.
  }
  trackPurchase({
    transactionId: data.orderNumber || sessionId,
    value: data.totalCents / 100,
    tax: data.taxCents != null ? data.taxCents / 100 : undefined,
    sha256Email: readConsent()?.advertising && data.sha256Email ? data.sha256Email : undefined,
  });
}

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
      .then((data) => {
        setOrderNumber(data.orderNumber || null);
        // An admin test checkout (cs_test_...) is not a sale, so the ad platforms don't hear about it.
        if (data.paid && typeof data.totalCents === 'number' && !sessionId.startsWith('cs_test_')) reportPurchaseOnce(sessionId, data);
      })
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
