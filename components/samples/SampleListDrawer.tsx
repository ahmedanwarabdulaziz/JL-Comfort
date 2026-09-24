'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Button, Divider, Drawer, IconButton, LinearProgress, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSampleCart } from '@/lib/context/SampleCartContext';
import { brand } from '@/lib/theme';

/**
 * The customer's free-sample list, like a mini cart: slides in when a sample is added (and from the
 * header icon), shows the swatches and how many more fit, and leads to the request form.
 */
export default function SampleListDrawer() {
  const pathname = usePathname();
  const { items, removeSample, settings, isListOpen, setListOpen } = useSampleCart();
  if (pathname?.startsWith('/admin')) return null;

  const max = settings.maxPerRequest;
  const left = Math.max(0, max - items.length);

  return (
    <Drawer anchor="right" open={isListOpen} onClose={() => setListOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.8rem', textTransform: 'uppercase', color: brand.ink }}>Your free samples</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: brand.textSecondary }}>
            {items.length} of {max} · {left > 0 ? `room for ${left} more` : 'list is full'}
          </Typography>
        </Box>
        <IconButton onClick={() => setListOpen(false)} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>
      <LinearProgress variant="determinate" value={Math.min(100, (items.length / max) * 100)} sx={{ height: 3, bgcolor: '#ece7e0', '& .MuiLinearProgress-bar': { bgcolor: brand.mocha } }} />

      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
        {items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: brand.ink, fontWeight: 600, mb: 1 }}>No samples yet</Typography>
            <Typography sx={{ color: brand.textSecondary, fontSize: '0.9rem', mb: 3 }}>
              Open any fabric and choose &quot;Order free sample&quot;. You can request up to {max} at a time.
            </Typography>
            <Button component={Link} href="/fabrics" onClick={() => setListOpen(false)} variant="outlined" sx={{ borderColor: brand.ink, color: brand.ink }}>
              Browse fabrics
            </Button>
          </Box>
        ) : (
          items.map((item) => (
            <Box key={item.fabricId} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', py: 1.25, borderBottom: '1px solid #ece7e0' }}>
              <Box sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: '#f5f3f0', border: '1px solid #e5e0d9', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: brand.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: brand.textSecondary }}>Free sample</Typography>
              </Box>
              <IconButton size="small" onClick={() => removeSample(item.fabricId)} aria-label={`Remove ${item.name}`}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))
        )}
      </Box>

      {items.length > 0 && (
        <Box sx={{ p: 2.5, borderTop: '1px solid #ece7e0' }}>
          <Button
            component={Link}
            href="/request-samples"
            onClick={() => setListOpen(false)}
            fullWidth
            variant="contained"
            disableElevation
            sx={{ bgcolor: brand.ink, color: brand.chalk, py: 1.5, '&:hover': { bgcolor: brand.mocha } }}
          >
            Request my {items.length} sample{items.length === 1 ? '' : 's'}
          </Button>
          <Divider sx={{ my: 1.25, border: 0 }} />
          <Button fullWidth onClick={() => setListOpen(false)} sx={{ color: brand.ink }}>
            Keep browsing
          </Button>
          <Typography sx={{ mt: 1, textAlign: 'center', fontSize: '0.75rem', color: brand.textSecondary }}>
            Samples are free and shipped to you. We email the tracking number.
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}
