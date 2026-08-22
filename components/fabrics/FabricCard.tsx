'use client';

import Link from 'next/link';
import { Box, Typography, Chip } from '@mui/material';
import { CharlotteFabricSnapshotItem } from '@/lib/types/charlotteFabric';

// Map color facet values to approximate CSS hex for the swatch dots
const COLOR_HEX: Record<string, string> = {
  'red-burgundy': '#8B1A2B',
  'orange-rust': '#C2612A',
  'gold-yellow': '#D4A017',
  'green': '#3A7A47',
  'aqua-teal': '#2A8A8A',
  'blue': '#2A5FA8',
  'purple': '#6A3A9A',
  'coral-peach': '#E07060',
  'pink': '#D4608A',
  'beige-taupe': '#B8A898',
  'brown': '#6B4226',
  'black': '#1A1A1A',
  'grey-silver': '#8A8A8A',
  'white-ivory': '#F0EDE5',
};

export default function FabricCard({ fabric }: { fabric: CharlotteFabricSnapshotItem }) {
  const colorSwatches = (fabric.color ?? []).slice(0, 4);
  const hasFreeSample = fabric.availability === 'InStock';
  const isNew = fabric.isNew;

  return (
    <Box
      component={Link}
      href={`/fabrics/${fabric.id}`}
      sx={{
        display: 'block',
        textDecoration: 'none',
        borderRadius: '12px',
        overflow: 'hidden',
        bgcolor: '#fff',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
          '& .fabric-img': { transform: 'scale(1.07)' },
          '& .fabric-overlay': { opacity: 1 },
        },
      }}
    >
      {/* Image zone */}
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', bgcolor: '#f5f2ee' }}>
        {fabric.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="fabric-img"
            src={fabric.imageUrl}
            alt={fabric.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.35s ease',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#ede9e3',
            }}
          >
            <Typography variant="caption" sx={{ color: '#aaa', fontStyle: 'italic' }}>
              No Image
            </Typography>
          </Box>
        )}

        {/* Hover overlay */}
        <Box
          className="fabric-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)',
            opacity: 0,
            transition: 'opacity 0.25s ease',
            display: 'flex',
            alignItems: 'flex-end',
            p: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#e3c29a',
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              fontSize: '0.7rem',
            }}
          >
            View Details →
          </Typography>
        </Box>

        {/* Badges top-left */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {isNew && (
            <Chip
              label="New"
              size="small"
              sx={{ bgcolor: '#e3c29a', color: '#000', fontWeight: 700, fontSize: '0.65rem', height: 20, '& .MuiChip-label': { px: 1 } }}
            />
          )}
          {hasFreeSample && (
            <Chip
              label="Free Sample"
              size="small"
              sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 20, '& .MuiChip-label': { px: 1 } }}
            />
          )}
        </Box>
      </Box>

      {/* Info zone */}
      <Box sx={{ p: 1.5, pt: 1.25 }}>
        {/* Color swatches */}
        {colorSwatches.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75 }}>
            {colorSwatches.map((c) => (
              <Box
                key={c}
                title={c.replace(/-/g, ' ')}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: COLOR_HEX[c] ?? '#ccc',
                  border: '1px solid rgba(0,0,0,0.12)',
                  flexShrink: 0,
                }}
              />
            ))}
            {(fabric.color ?? []).length > 4 && (
              <Typography variant="caption" sx={{ color: '#999', fontSize: '0.65rem', lineHeight: '12px' }}>
                +{fabric.color.length - 4}
              </Typography>
            )}
          </Box>
        )}

        {/* Name */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            display: 'block',
            color: '#1a1a1a',
            lineHeight: 1.35,
            mb: 0.25,
            fontSize: '0.78rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fabric.name}
        </Typography>

        {/* Price */}
        <Typography
          variant="caption"
          sx={{ display: 'block', color: '#b8935f', fontWeight: 700, fontSize: '0.78rem', mb: 0.25 }}
        >
          {fabric.pricePerYard != null ? `$${fabric.pricePerYard.toFixed(2)} / yd` : 'Price on request'}
        </Typography>

        {/* Material / fiber */}
        {(fabric.fiberContent || (fabric.material ?? []).length > 0) && (
          <Typography
            variant="caption"
            sx={{ display: 'block', color: '#888', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {fabric.fiberContent ?? (fabric.material ?? []).join(', ')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
