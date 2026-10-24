// Plain brand values with no MUI dependency, so Server Components can use them too (lib/theme.ts
// builds the MUI theme, which only works on the client). lib/theme.ts re-exports these.

// Single source of truth for the JL Comfort brand palette: slate navy (ink),
// orange (accent) and warm grey (stone). Pages should reference these tokens
// instead of hardcoding hex values.
export const brand = {
  ink: '#33384F',
  inkSoft: 'rgba(246,242,235,0.72)',
  accent: '#E28147',
  accentLight: '#EC9F6E',
  accentDeep: '#B8612A',
  stone: '#A6A6A4',
  chalk: '#F6F2EB',
  chalkLine: 'rgba(51,56,79,0.14)',
  textSecondary: 'rgba(51,56,79,0.68)',
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
