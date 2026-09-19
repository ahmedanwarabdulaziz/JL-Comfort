'use client';

import { Button, ButtonProps } from '@mui/material';
import { brand, tagClip } from '@/lib/theme';

type Tone = 'fill' | 'dark' | 'ghost' | 'ghostDark';

interface TagButtonProps extends ButtonProps {
  tone?: Tone;
}

const TONE_STYLES: Record<Tone, { bg: string; color: string; hoverBg: string; stitch: string; ring?: string }> = {
  fill: { bg: brand.butter, color: brand.ink, hoverBg: brand.lime, stitch: brand.ink },
  dark: { bg: brand.ink, color: brand.chalk, hoverBg: brand.mochaDeep, stitch: brand.chalk },
  ghost: { bg: 'transparent', color: brand.chalk, hoverBg: 'rgba(246,242,235,0.1)', stitch: brand.chalk, ring: 'rgba(246,242,235,0.45)' },
  ghostDark: { bg: 'transparent', color: brand.ink, hoverBg: 'rgba(33,23,18,0.06)', stitch: brand.ink, ring: 'rgba(33,23,18,0.3)' },
};

/**
 * The site's signature CTA shape — a single clipped corner (the
 * swatch-card / price-tag motif) with a small stitched-seam detail tucked
 * into it, instead of a traditional rounded rectangle.
 */
export default function TagButton({ tone = 'fill', sx, children, ...props }: TagButtonProps) {
  const t = TONE_STYLES[tone];

  return (
    <Button
      disableElevation
      disableRipple
      {...props}
      sx={{
        position: 'relative',
        display: 'inline-block',
        bgcolor: t.bg,
        color: t.color,
        px: 3.5,
        py: 1.8,
        fontSize: '0.85rem',
        clipPath: tagClip(16),
        boxShadow: t.ring ? `inset 0 0 0 1.5px ${t.ring}` : 'none',
        transition: 'background-color 0.25s ease, color 0.25s ease, transform 0.2s ease',
        '&:hover': {
          bgcolor: t.hoverBg,
          transform: 'translateY(-3px)',
          boxShadow: t.ring ? `inset 0 0 0 1.5px ${t.ring}` : 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 18,
          height: 18,
          backgroundImage: `repeating-linear-gradient(-45deg, ${t.stitch} 0 2px, transparent 2px 6px)`,
          WebkitMask: 'linear-gradient(-45deg, transparent 48%, #000 50%)',
          mask: 'linear-gradient(-45deg, transparent 48%, #000 50%)',
          opacity: 0.5,
          pointerEvents: 'none',
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}
