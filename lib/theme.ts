import { createTheme } from '@mui/material/styles';

import { brand } from './brand';

export { brand, swatchClip, tagClip } from './brand';

const displayFont = 'var(--font-display), Georgia, serif';
const labelFont = 'var(--font-label), sans-serif'; // Work Sans (app/layout.tsx)

export const theme = createTheme({
  palette: {
    primary: {
      main: brand.ink,
      contrastText: brand.chalk,
    },
    secondary: {
      main: brand.accent,
      light: brand.accentLight,
      dark: brand.accentDeep,
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
    // Buttons use the Work Sans body face (inherited from <html>) in spaced capitals.
    button: {
      fontFamily: 'inherit',
      textTransform: 'uppercase',
      fontWeight: 600,
      letterSpacing: '0.08em',
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
