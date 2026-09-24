'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { brand } from '@/lib/theme';

interface SampleBookCoverProps {
  title: string;
  series?: string; // small line above the title, e.g. "Performance"
  footnote?: string; // small line under the title, e.g. "58 fabrics"
  photo?: string; // the cover fabric
  edgePhotos?: string[]; // other fabrics in the book, shown as the swatch edge along the bottom
}

/**
 * A sample book drawn like the physical binder: branded header bar, white title label with a rule,
 * the cover fabric, and a strip of stacked swatch edges along the bottom. Text sizes use container
 * query units (cqw), so the same cover works as a small homepage tile or a large catalog card.
 */
export default function SampleBookCover({ title, series, footnote, photo, edgePhotos = [] }: SampleBookCoverProps) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const ok = (src?: string): src is string => !!src && !failed[src];
  const fail = (src: string) => () => setFailed((prev) => ({ ...prev, [src]: true }));
  const edges = edgePhotos.filter(ok).slice(0, 6);

  return (
    <Box
      sx={{
        containerType: 'inline-size',
        position: 'relative',
        aspectRatio: '300 / 331',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        border: '1px solid #d9d3cb',
        boxShadow: '0 1px 2px rgba(33,23,18,0.18), 0 8px 18px rgba(33,23,18,0.10)',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          flex: '0 0 auto',
          height: '9%',
          bgcolor: brand.ink,
          color: brand.chalk,
          px: '5cqw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box component="span" sx={{ fontWeight: 800, letterSpacing: '0.14em', fontSize: '4cqw', lineHeight: 1 }}>
          JL COMFORT
        </Box>
        <Box component="span" sx={{ fontWeight: 600, letterSpacing: '0.12em', fontSize: '2.4cqw', opacity: 0.7, lineHeight: 1 }}>
          SAMPLE BOOK
        </Box>
      </Box>

      {/* Title label */}
      <Box sx={{ flex: '0 0 auto', px: '5cqw', pt: '3.2cqw', pb: '3cqw', borderBottom: `0.9cqw solid ${brand.mocha}` }}>
        {series && (
          <Box sx={{ color: brand.mocha, fontWeight: 700, letterSpacing: '0.12em', fontSize: '2.7cqw', textTransform: 'uppercase', lineHeight: 1.2 }}>
            {series}
          </Box>
        )}
        <Box
          sx={{
            color: brand.ink,
            fontWeight: 700,
            letterSpacing: '0.04em',
            fontSize: '5.2cqw',
            textTransform: 'uppercase',
            lineHeight: 1.12,
            mt: '0.8cqw',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </Box>
        {footnote && (
          <Box sx={{ color: brand.textSecondary, fontSize: '2.5cqw', mt: '1cqw', lineHeight: 1.2 }}>{footnote}</Box>
        )}
      </Box>

      {/* Cover fabric */}
      <Box sx={{ flex: '1 1 auto', minHeight: 0, bgcolor: '#ede9e3', position: 'relative' }}>
        {ok(photo) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            loading="lazy"
            onError={fail(photo)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </Box>

      {/* Swatch edges */}
      <Box sx={{ flex: '0 0 auto', height: '7%', display: 'flex', bgcolor: '#ede9e3', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(33,23,18,0.25)' }}>
        {(edges.length > 0 ? edges : ok(photo) ? [photo] : []).map((src, i) => (
          <Box key={`${src}-${i}`} sx={{ flex: 1, position: 'relative', borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.65)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              loading="lazy"
              onError={fail(src)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** "Decorative Durables X & Ring Book Page #21" -> "Decorative Durables X" (supplier binder notes). */
export const cleanBookName = (name: string) => name.replace(/\s*&\s*Ring Book Page\s*#?\s*\w+\s*$/i, '').trim();

/** A short series line for the cover label, from words in the book name. */
export const bookSeries = (name: string) => {
  if (/crypton|performance/i.test(name)) return 'Performance';
  if (/patio|outdoor|cabana|sunbrella/i.test(name)) return 'Outdoor';
  if (/sheer/i.test(name)) return 'Sheers';
  if (/velvet|chenille/i.test(name)) return 'Plush textures';
  if (/linen|cotton/i.test(name)) return 'Natural fibres';
  return 'Fabric collection';
};
