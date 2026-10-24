'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import { brand } from '@/lib/theme';
import { BASE_YARDAGE, wholeYards, yardageFactor } from '@/lib/seo/fabricCopy';

// The interactive part of the "How much fabric do I need?" guide. Same baseline amounts and
// width/repeat adjustment as the yardage tab on every fabric page (lib/seo/fabricCopy.ts).

const WIDTHS = [54, 56, 58, 60, 48];
const REPEATS = [
  { label: 'Plain or small pattern (under 6")', inches: 0 },
  { label: 'Medium repeat (6" to 12")', inches: 6 },
  { label: 'Large repeat (13" or more)', inches: 13 },
];

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#fff' } };

export default function YardageCalculator() {
  const [piece, setPiece] = useState(5); // armchair
  const [count, setCount] = useState(1);
  const [width, setWidth] = useState(54);
  const [repeat, setRepeat] = useState(0);

  const [label, min, max] = BASE_YARDAGE[piece];
  const factor = yardageFactor(width, repeat);
  const lo = wholeYards(min * count, factor);
  const hi = wholeYards(max * count, factor);

  return (
    <Box sx={{ border: '1px solid #e5e0d9', bgcolor: brand.chalk, p: { xs: 2.5, md: 4 }, my: 4 }}>
      <Typography component="h2" sx={{ fontFamily: 'var(--font-display), serif', fontSize: { xs: '1.4rem', md: '1.7rem' }, color: brand.ink, mb: 0.5 }}>
        Yardage calculator
      </Typography>
      <Typography sx={{ color: brand.textSecondary, fontSize: '0.92rem', mb: 3 }}>
        Pick your piece and your fabric&rsquo;s width and pattern repeat (both are listed on every fabric page).
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
        <TextField select label="Piece of furniture" value={piece} onChange={(e) => setPiece(Number(e.target.value))} sx={fieldSx}>
          {BASE_YARDAGE.map(([item], i) => (
            <MenuItem key={item} value={i}>{item}</MenuItem>
          ))}
        </TextField>
        <TextField select label="How many" value={count} onChange={(e) => setCount(Number(e.target.value))} sx={fieldSx}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </TextField>
        <TextField select label="Fabric width" value={width} onChange={(e) => setWidth(Number(e.target.value))} sx={fieldSx}>
          {WIDTHS.map((w) => (
            <MenuItem key={w} value={w}>{w}&quot;{w === 54 ? ' (most upholstery fabric)' : ''}</MenuItem>
          ))}
        </TextField>
        <TextField select label="Pattern repeat" value={repeat} onChange={(e) => setRepeat(Number(e.target.value))} sx={fieldSx}>
          {REPEATS.map((r) => (
            <MenuItem key={r.inches} value={r.inches}>{r.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box aria-live="polite" sx={{ mt: 3, p: 2.5, bgcolor: '#fff', border: `1px solid ${brand.ink}`, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 1.5 }}>
        <Typography sx={{ color: brand.textSecondary, fontSize: '0.9rem' }}>
          {count > 1 ? `${count} × ${label.toLowerCase()}` : label}:
        </Typography>
        <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: brand.ink }}>
          {lo === hi ? lo : `${lo}–${hi}`} yards
        </Typography>
      </Box>
      <Typography sx={{ color: brand.textSecondary, fontSize: '0.8rem', mt: 1.25, lineHeight: 1.6 }}>
        An estimate for typical sizes. Confirm the exact amount with your upholsterer before ordering, and order it all at once so it
        comes from the same dye lot.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
        <Button component={Link} href="/fabrics" variant="contained" disableElevation sx={{ borderRadius: 0, bgcolor: brand.ink, '&:hover': { bgcolor: brand.accent } }}>
          Browse fabrics
        </Button>
        <Button component={Link} href="/sample-books" variant="outlined" sx={{ borderRadius: 0, borderColor: brand.ink, color: brand.ink }}>
          Order free samples
        </Button>
      </Box>
    </Box>
  );
}
