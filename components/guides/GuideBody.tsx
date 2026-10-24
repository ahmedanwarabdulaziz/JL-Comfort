import Link from 'next/link';
import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { brand } from '@/lib/brand';
import type { GuideBlock } from '@/lib/guideContent';

// Renders a guide's blocks (lib/guideContent.ts) in the site's article style. Server-only: the
// whole article is in the HTML, which is what search engines index.

const linkSx = { color: brand.accent };

// **bold**, *italic* and [text](href); internal links use next/link.
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = match.index;
    if (match[1]) out.push(<strong key={key}>{inline(match[1])}</strong>);
    else if (match[2]) out.push(<em key={key}>{match[2]}</em>);
    else if (match[4].startsWith('/'))
      out.push(<Box key={key} component={Link} href={match[4]} sx={linkSx}>{match[3]}</Box>);
    else
      out.push(<Box key={key} component="a" href={match[4]} target="_blank" rel="noopener" sx={linkSx}>{match[3]}</Box>);
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const pSx = { color: brand.textSecondary, fontSize: '1rem', lineHeight: 1.8, mb: 2 };

export default function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <Typography key={i} id={block.id} component="h2" sx={{ fontFamily: 'var(--font-display), serif', fontSize: { xs: '1.45rem', md: '1.75rem' }, color: brand.ink, mt: 6, mb: 1.5, scrollMarginTop: 96 }}>
                {block.text}
              </Typography>
            );
          case 'h3':
            return (
              <Typography key={i} component="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: brand.ink, mt: 3, mb: 1 }}>
                {inline(block.text)}
              </Typography>
            );
          case 'p':
            return <Typography key={i} sx={pSx}>{inline(block.text)}</Typography>;
          case 'ul':
          case 'ol':
            return (
              <Box key={i} component={block.type} sx={{ ...pSx, pl: 3, '& li': { mb: 0.75 } }}>
                {block.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
              </Box>
            );
          case 'tip':
            return (
              <Box key={i} sx={{ borderLeft: `3px solid ${brand.accent}`, bgcolor: brand.chalk, px: 2.5, py: 2, my: 3 }}>
                <Typography sx={{ color: brand.ink, fontSize: '0.98rem', lineHeight: 1.75 }}>{inline(block.text)}</Typography>
              </Box>
            );
          case 'table':
            return (
              <Box key={i} sx={{ overflowX: 'auto', my: 3 }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem', '& th, & td': { textAlign: 'left', p: 1.25, borderBottom: '1px solid #e5e0d9', verticalAlign: 'top' }, '& th': { fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b857e' }, '& td': { color: brand.ink } }}>
                  <thead>
                    <tr>{block.head.map((cell, j) => <th key={j}>{inline(cell)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j}>{row.map((cell, k) => <td key={k}>{inline(cell)}</td>)}</tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            );
        }
      })}
    </>
  );
}
