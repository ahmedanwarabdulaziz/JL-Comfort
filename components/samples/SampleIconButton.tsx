'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { keyframes } from '@emotion/react';
import { Badge, Box, Button, ClickAwayListener, Fade, IconButton, Paper, Popper, Tooltip, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSampleCart } from '@/lib/context/SampleCartContext';
import { brand } from '@/lib/theme';

const bump = keyframes`
  0% { transform: scale(1); }
  30% { transform: scale(1.35); }
  55% { transform: scale(0.92); }
  75% { transform: scale(1.08); }
  100% { transform: scale(1); }
`;

const ring = keyframes`
  0% { transform: scale(0.6); opacity: 0.55; }
  100% { transform: scale(1.9); opacity: 0; }
`;

const FLY_MS = 700;
const NOTICE_MS = 5500;

/**
 * The header's free-samples icon. When a sample is added anywhere on the site, the swatch flies
 * from the button to this icon, the icon bumps with a soft ring, and a small notice drops down
 * with "View list" / "Request samples". The header renders one per layout (desktop and mobile);
 * only the visible one reacts. Motion is skipped for people who prefer reduced motion.
 */
export default function SampleIconButton({ sx }: { sx?: SxProps<Theme> }) {
  const { items, setListOpen, lastAdded, settings } = useSampleCart();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [bumpKey, setBumpKey] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!lastAdded || !button || !button.offsetParent) return; // not added yet, or this copy is hidden

    const timers: ReturnType<typeof setTimeout>[] = [];
    const arrive = () => {
      setBumpKey((k) => k + 1);
      setNoticeOpen(true);
      timers.push(setTimeout(() => setNoticeOpen(false), NOTICE_MS));
    };

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const { origin, item } = lastAdded;
    let flyer: HTMLImageElement | null = null;

    if (reduceMotion || !origin || !item.imageUrl) {
      arrive();
    } else {
      const target = button.getBoundingClientRect();
      const size = 64;
      const startX = origin.x + origin.width / 2 - size / 2;
      const startY = origin.y + origin.height / 2 - size / 2;
      flyer = document.createElement('img');
      flyer.src = item.imageUrl;
      flyer.alt = '';
      Object.assign(flyer.style, {
        position: 'fixed',
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'cover',
        zIndex: '2000',
        pointerEvents: 'none',
        border: '2px solid #fff',
        boxShadow: '0 8px 24px rgba(33,23,18,0.35)',
        transition: `transform ${FLY_MS}ms cubic-bezier(0.55, -0.15, 0.3, 1), opacity ${FLY_MS}ms ease-in`,
      } as Partial<CSSStyleDeclaration>);
      document.body.appendChild(flyer);
      void flyer.getBoundingClientRect(); // commit the start position before moving
      const dx = target.left + target.width / 2 - (startX + size / 2);
      const dy = target.top + target.height / 2 - (startY + size / 2);
      flyer.style.transform = `translate(${dx}px, ${dy}px) scale(0.22)`;
      flyer.style.opacity = '0.4';
      timers.push(
        setTimeout(() => {
          flyer?.remove();
          flyer = null;
          arrive();
        }, FLY_MS)
      );
    }

    return () => {
      timers.forEach(clearTimeout);
      flyer?.remove();
    };
  }, [lastAdded]);

  const count = items.length;
  const added = lastAdded?.item;

  return (
    <>
      <Tooltip title="Your free samples">
        <IconButton
          ref={buttonRef}
          onClick={() => {
            setNoticeOpen(false);
            setListOpen(true);
          }}
          aria-label={`Your free samples (${count})`}
          sx={{ position: 'relative', color: brand.ink, '&:hover': { color: brand.mocha }, ...sx }}
        >
          {bumpKey > 0 && (
            <Box
              key={`ring-${bumpKey}`}
              aria-hidden
              sx={{ position: 'absolute', inset: 4, borderRadius: '50%', border: `2px solid ${brand.mocha}`, animation: `${ring} 900ms ease-out forwards`, pointerEvents: 'none' }}
            />
          )}
          <Box key={`icon-${bumpKey}`} sx={{ display: 'flex', animation: bumpKey > 0 ? `${bump} 650ms ease-out` : 'none' }}>
            <Badge
              badgeContent={count}
              invisible={count === 0}
              sx={{ '& .MuiBadge-badge': { bgcolor: brand.mocha, color: brand.chalk, fontWeight: 700, fontSize: '0.65rem', minWidth: 18, height: 18 } }}
            >
              <StyleOutlinedIcon />
            </Badge>
          </Box>
        </IconButton>
      </Tooltip>

      <Popper open={noticeOpen && !!added} anchorEl={buttonRef.current} placement="bottom-end" transition sx={{ zIndex: 1300 }} modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Box>
              <ClickAwayListener onClickAway={() => setNoticeOpen(false)}>
                <Paper
                  role="status"
                  elevation={0}
                  sx={{ width: 340, maxWidth: 'calc(100vw - 24px)', p: 2, border: `1px solid #e5e0d9`, boxShadow: '0 12px 32px rgba(33,23,18,0.16)', borderTop: `3px solid ${brand.mocha}` }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ width: 48, height: 48, flexShrink: 0, bgcolor: '#f5f3f0', overflow: 'hidden', border: '1px solid #e5e0d9' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {added?.imageUrl && <img src={added.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.78rem', fontWeight: 700, color: brand.mocha, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        <CheckCircleIcon sx={{ fontSize: 15 }} /> Added to your samples
                      </Typography>
                      <Typography sx={{ fontSize: '0.88rem', color: brand.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{added?.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: brand.textSecondary }}>
                        {count} of {settings.maxPerRequest} free samples
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, '& .MuiButton-root': { whiteSpace: 'nowrap', fontSize: '0.72rem' } }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setNoticeOpen(false);
                        setListOpen(true);
                      }}
                      sx={{ borderColor: brand.ink, color: brand.ink }}
                    >
                      View list
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      disableElevation
                      component={Link}
                      href="/request-samples"
                      onClick={() => setNoticeOpen(false)}
                      sx={{ bgcolor: brand.ink, color: brand.chalk, '&:hover': { bgcolor: brand.mocha } }}
                    >
                      Request samples
                    </Button>
                  </Box>
                </Paper>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
}
