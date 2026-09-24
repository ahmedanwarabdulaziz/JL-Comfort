'use client';

import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { CharlotteFabricSnapshotItem } from '@/lib/types/charlotteFabric';
import { brand } from '@/lib/theme';

export interface CardColourway {
  id: string;
  name: string;
  imageUrl: string;
}

const MAX_SWATCHES = 5;

/** "D2144 Wedgewood Scales" -> { pattern: "D2144", colourway: "Wedgewood Scales" }. */
const splitName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length > 0 && /\d/.test(first) ? { pattern: first, colourway: rest.join(' ') } : { pattern: '', colourway: name };
};

/**
 * Shop grid card in the dealer style: square fabric image, pattern number, colourway name, price per
 * yard, and a row of colourway thumbnails (other colours of the same pattern).
 */
export default function FabricCard({ fabric, colourways }: { fabric: CharlotteFabricSnapshotItem; colourways?: CardColourway[] }) {
  const { pattern, colourway } = splitName(fabric.name);
  const others = (colourways || []).filter((c) => c.id !== fabric.id);
  const swatches = others.slice(0, MAX_SWATCHES);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        component={Link}
        href={`/fabrics/${fabric.id}`}
        sx={{ display: 'block', textDecoration: 'none', color: 'inherit', '&:hover .fabric-img': { transform: 'scale(1.05)' }, '&:hover .fabric-view': { opacity: 1 } }}
      >
        <Box sx={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', bgcolor: '#f5f3f0', border: '1px solid #ece7e0' }}>
          {fabric.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="fabric-img"
              src={fabric.imageUrl}
              alt={fabric.name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
            />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: '#aaa' }}>No image</Typography>
            </Box>
          )}
          {fabric.isNew && (
            <Box sx={{ position: 'absolute', top: 10, left: 10, px: 1, py: 0.3, bgcolor: brand.ink, color: brand.chalk, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              New
            </Box>
          )}
          <Box
            className="fabric-view"
            sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, py: 1, textAlign: 'center', bgcolor: 'rgba(33,23,18,0.78)', color: brand.chalk, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0, transition: 'opacity .25s' }}
          >
            View fabric
          </Box>
        </Box>

        <Box sx={{ pt: 1.5 }}>
          {pattern && (
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', color: '#8b857e', textTransform: 'uppercase' }}>{pattern}</Typography>
          )}
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: brand.ink, lineHeight: 1.3, mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {colourway}
          </Typography>
          <Typography sx={{ fontSize: '0.86rem', color: brand.ink, mt: 0.5 }}>
            {fabric.pricePerYard != null ? (
              <>
                ${fabric.pricePerYard.toFixed(2)} <Box component="span" sx={{ color: '#8b857e', fontSize: '0.78rem' }}>CAD per yard</Box>
              </>
            ) : (
              <Box component="span" sx={{ color: '#8b857e' }}>Price on request</Box>
            )}
          </Typography>
        </Box>
      </Box>

      {swatches.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, alignItems: 'center' }}>
          {swatches.map((c) => (
            <Box
              key={c.id}
              component={Link}
              href={`/fabrics/${c.id}`}
              title={splitName(c.name).colourway}
              aria-label={`${splitName(c.name).colourway} colourway`}
              sx={{ width: 26, height: 26, flexShrink: 0, border: '1px solid #e0dad2', overflow: 'hidden', '&:hover': { borderColor: brand.mocha } }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.imageUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </Box>
          ))}
          {others.length > MAX_SWATCHES && (
            <Typography sx={{ fontSize: '0.72rem', color: '#8b857e', ml: 0.25 }}>+{others.length - MAX_SWATCHES}</Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
