import { createTheme } from '@mui/material/styles';

// Single source of truth for the "Swatch Report" brand palette — a
// color-blocked, trend-forecast identity built from real seasonal textile
// colors rather than a generic neutral+accent scheme. Pages should reference
// these tokens instead of hardcoding hex values.
export const brand = {
  ink: '#211712',
  inkSoft: 'rgba(246,242,235,0.72)',
  mocha: '#8B6552',
  mochaDeep: '#6E4F3F',
  butter: '#F3D17E',
  lime: '#CFE267',
  chalk: '#F6F2EB',
  chalkLine: 'rgba(33,23,18,0.14)',
  textSecondary: 'rgba(33,23,18,0.65)',
};

// Shared clip-path for the "tag" shape used by TagButton and other die-cut
// UI (a single clipped corner — the swatch-card / price-tag motif — instead
// of a traditional rounded rectangle).
export const tagClip = (size = 16) =>
  `polygon(0 0, 100% 0, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0 100%)`;

// Matches the corner-cut used on the swatch/colorway cards (opposite corner
// from the button, for variety).
export const swatchClip = (size = 20) =>
  `polygon(${size}px 0, 100% 0, 100% 100%, 0 100%, 0 ${size}px)`;

const displayFont = 'var(--font-display), Georgia, serif';
const labelFont = 'var(--font-label), "Arial Narrow", sans-serif';

export const theme = createTheme({
  palette: {
    primary: {
      main: brand.ink,
      contrastText: brand.chalk,
    },
    secondary: {
      main: brand.mocha,
      light: brand.butter,
      dark: brand.mochaDeep,
      contrastText: brand.ink,
    },
    background: {
      default: brand.chalk,
      paper: '#ffffff',
    },
    text: {
      primary: brand.ink,
      secondary: brand.textSecondary,
    },
    divider: brand.chalkLine,
  },
  typography: {
    // Inherit the Work Sans body face already applied via next/font on
    // <html> in app/layout.tsx.
    fontFamily: 'inherit',
    h1: { fontFamily: displayFont, fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontFamily: displayFont, fontWeight: 600 },
    h3: { fontFamily: displayFont, fontWeight: 600 },
    h4: { fontFamily: displayFont, fontWeight: 600 },
    h5: { fontFamily: displayFont, fontWeight: 600 },
    h6: { fontFamily: displayFont, fontWeight: 600 },
    overline: {
      fontFamily: labelFont,
      fontWeight: 700,
      letterSpacing: '0.14em',
      lineHeight: 1.6,
    },
    button: {
      fontFamily: labelFont,
      textTransform: 'uppercase',
      fontWeight: 700,
      letterSpacing: '0.06em',
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});
