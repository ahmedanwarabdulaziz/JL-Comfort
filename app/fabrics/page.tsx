import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import FabricsShopClient from '@/components/fabrics/FabricsShopClient';

export const metadata: Metadata = {
  title: 'Shop Fabrics | JL Comfort',
  description: 'Browse and order premium upholstery fabrics by the yard — real per-SKU pricing, free samples, thousands of colours and patterns.',
};

export default function FabricsPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#e3c29a' }} />
        </Box>
      }
    >
      <FabricsShopClient />
    </Suspense>
  );
}
