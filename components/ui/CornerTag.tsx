import { Box, BoxProps } from '@mui/material';
import { brand } from '@/lib/theme';

interface CornerTagProps extends BoxProps {
  tone?: 'dark' | 'light';
}

/** Small die-cut label badge — the nav "season drop" tag, or any inline chip that should read as a swatch tag rather than a pill. */
export default function CornerTag({ tone = 'dark', sx, children, ...props }: CornerTagProps) {
  const bg = tone === 'dark' ? brand.ink : brand.chalk;
  const color = tone === 'dark' ? brand.chalk : brand.ink;

  return (
    <Box
      component="span"
      {...props}
      sx={{
        display: 'inline-block',
        bgcolor: bg,
        color,
        fontFamily: 'var(--font-label), sans-serif',
        fontWeight: 700,
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        px: '13px',
        py: '6px',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
