'use client';

import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { brand } from '@/lib/theme';

type Action = { label: string; href?: string; onClick?: () => void };

/** Body of the "added" notice under a header icon: image, what was added, details, two actions. */
export default function AddedNotice({
  heading,
  imageUrl,
  title,
  detail,
  secondary,
  primary,
  close,
}: {
  heading: string;
  imageUrl?: string;
  title?: string;
  detail?: string;
  secondary: Action;
  primary: Action;
  close: () => void;
}) {
  const action = (a: Action, contained: boolean) => (
    <Button
      fullWidth
      size="small"
      variant={contained ? 'contained' : 'outlined'}
      disableElevation
      {...(a.href ? { component: Link, href: a.href } : {})}
      onClick={() => {
        close();
        a.onClick?.();
      }}
      sx={contained ? { bgcolor: brand.ink, color: brand.chalk, '&:hover': { bgcolor: brand.mocha } } : { borderColor: brand.ink, color: brand.ink }}
    >
      {a.label}
    </Button>
  );

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ width: 48, height: 48, flexShrink: 0, bgcolor: '#f5f3f0', overflow: 'hidden', border: '1px solid #e5e0d9' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {imageUrl && <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.78rem', fontWeight: 700, color: brand.mocha, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <CheckCircleIcon sx={{ fontSize: 15 }} /> {heading}
          </Typography>
          {title && (
            <Typography sx={{ fontSize: '0.88rem', color: brand.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
          )}
          {detail && <Typography sx={{ fontSize: '0.75rem', color: brand.textSecondary }}>{detail}</Typography>}
        </Box>
      </Box>
      <Box className="notice-actions" sx={{ display: 'flex', gap: 1 }}>
        {action(secondary, false)}
        {action(primary, true)}
      </Box>
    </>
  );
}
