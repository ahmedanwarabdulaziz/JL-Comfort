'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { keyframes } from '@emotion/react';
import { Badge, Box, ClickAwayListener, Fade, IconButton, Paper, Popper, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { brand } from '@/lib/theme';

/** Where an "add" click happened, so the header can fly the product image to its icon. */
export interface AddOrigin {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AddedEvent {
  imageUrl?: string;
  origin: AddOrigin | null;
  at: number; // changes on every add
}

export const originOf = (element: Element): AddOrigin => {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
};

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
 * A header icon (free samples, cart) that reacts when something is added anywhere on the site: the
 * product image flies from the button to the icon, the icon bumps with a soft ring, and a small
 * notice drops down under it and hides after a few seconds. The header renders one copy per layout
 * (desktop and mobile); only the visible copy reacts. Reduced-motion users skip the flight.
 */
export default function HeaderIconWithNotice({
  icon,
  label,
  count,
  added,
  href,
  onClick,
  renderNotice,
  sx,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  added: AddedEvent | null;
  href?: string; // icon links here, or…
  onClick?: () => void; // …runs this
  renderNotice: (close: () => void) => ReactNode;
  sx?: SxProps<Theme>;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [bumpKey, setBumpKey] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const close = () => setNoticeOpen(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!added || !button || !button.offsetParent) return; // nothing added yet, or this copy is hidden

    const timers: ReturnType<typeof setTimeout>[] = [];
    const arrive = () => {
      setBumpKey((k) => k + 1);
      setNoticeOpen(true);
      timers.push(setTimeout(() => setNoticeOpen(false), NOTICE_MS));
    };

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const { origin, imageUrl } = added;
    let flyer: HTMLImageElement | null = null;

    if (reduceMotion || !origin || !imageUrl) {
      arrive();
    } else {
      const target = button.getBoundingClientRect();
      const size = 64;
      const startX = origin.x + origin.width / 2 - size / 2;
      const startY = origin.y + origin.height / 2 - size / 2;
      flyer = document.createElement('img');
      flyer.src = imageUrl;
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
  }, [added]);

  const linkProps = href ? { component: Link, href } : {};

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          ref={buttonRef}
          {...linkProps}
          onClick={() => {
            close();
            onClick?.();
          }}
          aria-label={`${label} (${count})`}
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
              {icon}
            </Badge>
          </Box>
        </IconButton>
      </Tooltip>

      <Popper open={noticeOpen && !!added} anchorEl={buttonRef.current} placement="bottom-end" transition sx={{ zIndex: 1300 }} modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Box>
              <ClickAwayListener onClickAway={close}>
                <Paper
                  role="status"
                  elevation={0}
                  sx={{
                    width: 340,
                    maxWidth: 'calc(100vw - 24px)',
                    p: 2,
                    border: '1px solid #e5e0d9',
                    boxShadow: '0 12px 32px rgba(33,23,18,0.16)',
                    borderTop: `3px solid ${brand.mocha}`,
                    '& .notice-actions .MuiButton-root': { whiteSpace: 'nowrap', fontSize: '0.72rem' },
                  }}
                >
                  {renderNotice(close)}
                </Paper>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
}
