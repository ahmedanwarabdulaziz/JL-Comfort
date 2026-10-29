'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { brand } from '@/lib/theme';
import { useFreeShippingOver } from '@/lib/data/useShippingRate';
import { PENDING_CODE_EVENT, captureCodeFromUrl, readPendingCode } from '@/lib/discounts/pendingCode';

interface Offer {
  key: string;
  icon: ReactNode;
  label: string;
  href: string;
}

const ROTATE_MS = 3500;
const iconSx = { fontSize: { xs: 17, md: 18 } };

// Bar above the site header, in the accent colour so the offers are the first thing people read.
// Not sticky, so the sticky header keeps its place at the top. Desktop shows every offer in a row;
// phones rotate them one at a time so each gets the full width. A code that arrived in a link
// (?code=JLU25) is captured here, on any page, and announced first.
export default function AnnouncementBar() {
  const pathname = usePathname();
  const freeShippingOver = useFreeShippingOver();
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setPendingCode(captureCodeFromUrl() || readPendingCode());
  }, [pathname]);
  useEffect(() => {
    const sync = () => setPendingCode(readPendingCode());
    window.addEventListener(PENDING_CODE_EVENT, sync);
    return () => window.removeEventListener(PENDING_CODE_EVENT, sync);
  }, []);

  const offers: Offer[] = [
    ...(pendingCode ? [{ key: 'code', icon: <LocalOfferOutlinedIcon sx={iconSx} />, label: `Code ${pendingCode} saved — applied at checkout`, href: '/checkout' }] : []),
    ...(freeShippingOver !== null
      ? [{ key: 'shipping', icon: <LocalShippingOutlinedIcon sx={iconSx} />, label: `Free shipping over $${freeShippingOver.toFixed(0)}`, href: '/shipping-returns' }]
      : []),
    { key: 'samples', icon: <ContentCutIcon sx={iconSx} />, label: 'Free fabric samples', href: '/free-fabric-samples' },
    { key: 'warranty', icon: <VerifiedUserOutlinedIcon sx={iconSx} />, label: 'Charlotte Lifetime Warranty', href: '/shipping-returns#warranty' },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => current + 1), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (pathname?.startsWith('/admin')) return null; // same rule as SiteHeader
  const active = index % offers.length;

  return (
    <Box
      component="aside"
      aria-label="Current offers"
      sx={{
        bgcolor: brand.accent,
        color: brand.ink,
        fontWeight: 700,
        fontSize: { xs: '0.8rem', md: '0.86rem' },
        letterSpacing: '0.03em',
        py: { xs: 1, md: 1.1 },
        px: 2,
        minHeight: { xs: 38, md: 42 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { md: 4 },
        position: 'relative',
      }}
    >
      {offers.map((offer, i) => (
        <Box
          key={offer.key}
          component={Link}
          href={offer.href}
          sx={{
            color: 'inherit',
            textDecoration: 'none',
            alignItems: 'center',
            gap: 0.75,
            whiteSpace: 'nowrap',
            '&:hover': { textDecoration: 'underline' },
            // Desktop: all in a row (the code notice gets a white chip). Phones: only the active one, fading in.
            display: { xs: i === active ? 'inline-flex' : 'none', md: 'inline-flex' },
            animation: { xs: i === active ? 'jlOfferIn 400ms ease' : 'none', md: 'none' },
            '@keyframes jlOfferIn': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
            ...(offer.key === 'code' && { bgcolor: brand.chalk, px: 1.25, py: 0.25, borderRadius: 999 }),
          }}
        >
          {offer.icon}
          {offer.label}
        </Box>
      ))}
    </Box>
  );
}
