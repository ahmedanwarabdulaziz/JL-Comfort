'use client';

import Link from 'next/link';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { CharlotteFabricSnapshotItem } from '@/lib/types/charlotteFabric';

export default function FabricCard({ fabric }: { fabric: CharlotteFabricSnapshotItem }) {
  return (
    <Card
      component={Link}
      href={`/fabrics/${fabric.id}`}
      elevation={0}
      sx={{
        display: 'block',
        textDecoration: 'none',
        cursor: 'pointer',
        borderRadius: 2,
        border: '2px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        height: '100%',
        '&:hover': { borderColor: '#e3c29a' },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: '#fff' }}>
        {fabric.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fabric.imageUrl} alt={fabric.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">No Image</Typography>
          </Box>
        )}
      </Box>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: 'text.primary' }} noWrap>
          {fabric.name}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#8a6d3b' }}>
          {fabric.pricePerYard != null ? `$${fabric.pricePerYard.toFixed(2)}/yd` : 'Price on request'}
        </Typography>
        {fabric.fiberContent && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
            {fabric.fiberContent}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
