import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import FabricsShopClient from '@/components/fabrics/FabricsShopClient';
import CollectionDirectory from '@/components/collections/CollectionDirectory';
import { collectionGroups } from '@/lib/collections/definitions';

export const metadata: Metadata = {
  title: 'Upholstery Fabric by the Yard',
  alternates: { canonical: '/fabrics' },
  description: 'Browse and order premium upholstery fabrics by the yard — real per-SKU pricing, free samples, thousands of colours and patterns.',
};

export default function FabricsPage() {
  return (
    <>
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: '#e3c29a' }} />
          </Box>
        }
      >
        <FabricsShopClient />
      </Suspense>
      {/* Server-rendered, so search engines see links to every collection even though the shop grid above loads in the browser. */}
      <Box sx={{ borderTop: '1px solid #e5e0d9', bgcolor: '#F6F2EB' }}>
        <CollectionDirectory groups={collectionGroups()} heading="Shop upholstery fabric by category" />
      </Box>
    </>
  );
}
