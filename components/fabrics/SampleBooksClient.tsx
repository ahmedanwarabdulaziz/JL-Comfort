'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Chip,
  InputAdornment,
  TextField,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { CharlotteFabricSnapshotItem } from '@/lib/types/charlotteFabric';
import { getCharlotteFabricsSnapshot } from '@/lib/data/charlotteFabricCatalog';

interface SampleBook {
  name: string;
  fabricCount: number;
  previewImages: string[];
  sampleFabrics: CharlotteFabricSnapshotItem[];
}

export default function SampleBooksClient() {
  const [allFabrics, setAllFabrics] = useState<CharlotteFabricSnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCharlotteFabricsSnapshot()
      .then(setAllFabrics)
      .catch(() => setError('Failed to load catalog.'))
      .finally(() => setLoading(false));
  }, []);

  // Build books: group all fabrics by their sampleBooks entries
  const books: SampleBook[] = useMemo(() => {
    const map = new Map<string, CharlotteFabricSnapshotItem[]>();

    for (const fabric of allFabrics) {
      if (!fabric.sampleBooks?.length) continue;
      for (const book of fabric.sampleBooks) {
        const trimmed = book.trim();
        if (!trimmed) continue;
        if (!map.has(trimmed)) map.set(trimmed, []);
        map.get(trimmed)!.push(fabric);
      }
    }

    return Array.from(map.entries())
      .map(([name, fabrics]) => ({
        name,
        fabricCount: fabrics.length,
        previewImages: fabrics
          .filter((f) => f.imageUrl)
          .slice(0, 4)
          .map((f) => f.imageUrl),
        sampleFabrics: fabrics.slice(0, 4),
      }))
      .sort((a, b) => b.fabricCount - a.fabricCount);
  }, [allFabrics]);

  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter((b) => b.name.toLowerCase().includes(q));
  }, [books, search]);

  // How many fabrics have sampleBooks at all
  const coveredCount = useMemo(
    () => allFabrics.filter((f) => f.sampleBooks?.length).length,
    [allFabrics]
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9f7f4' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(160deg, #171310 0%, #0a0908 60%, #000 100%)',
          pt: { xs: 6, md: 8 },
          pb: { xs: 5, md: 7 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -60, left: '20%', width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(227,194,154,0.08)', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -50, right: '10%', width: 240, height: 240, borderRadius: '50%', bgcolor: 'rgba(227,194,154,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(227,194,154,0.12)', border: '1px solid rgba(227,194,154,0.25)', borderRadius: '20px', px: 2, py: 0.6, mb: 2.5 }}>
            <AutoStoriesIcon sx={{ fontSize: 15, color: '#e3c29a' }} />
            <Typography variant="caption" sx={{ color: '#e3c29a', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.72rem' }}>
              Physical Fabric Collections
            </Typography>
          </Box>

          <Typography variant="h3" component="h1" sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '2rem', md: '2.8rem' }, mb: 2 }}>
            Sample{' '}<Box component="span" sx={{ color: '#e3c29a' }}>Books</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 540, mx: 'auto', lineHeight: 1.75, mb: 4 }}>
            Browse our curated fabric collections — each sample book groups fabrics by style, use, or collection. Pick a book and request a swatch to feel the quality before you buy.
          </Typography>

          {/* Trust row */}
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
            {[
              { icon: <LocalShippingIcon sx={{ fontSize: 16 }} />, label: 'Free shipping on samples' },
              { icon: <AutoStoriesIcon sx={{ fontSize: 16 }} />, label: `${books.length || '—'} collections` },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ color: '#e3c29a' }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <Container maxWidth="lg">
          <Grid container>
            {[
              { n: '01', title: 'Browse a Collection', desc: "Find a sample book that matches your project style or colour palette." },
              { n: '02', title: 'Pick Your Fabrics', desc: "Click through to the fabric shop, filtered to that book's collection." },
              { n: '03', title: 'Request Free Swatches', desc: "Add fabrics to your sample cart and we'll ship swatches to your door free." },
            ].map((step, i) => (
              <Grid item xs={12} md={4} key={step.n}>
                <Box
                  sx={{
                    px: 4,
                    py: 3.5,
                    borderRight: i < 2 ? { xs: 'none', md: '1px solid rgba(0,0,0,0.07)' } : 'none',
                    borderBottom: { xs: i < 2 ? '1px solid rgba(0,0,0,0.07)' : 'none', md: 'none' },
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2.5,
                  }}
                >
                  <Typography sx={{ color: '#e3c29a', fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, mt: 0.25, flexShrink: 0 }}>
                    {step.n}
                  </Typography>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a1a1a', mb: 0.5 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#777', lineHeight: 1.65 }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>

        {/* ── SEARCH + COUNT ──────────────────────────────────────── */}
        {!loading && !error && books.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a1a', mb: 0.25 }}>
                {filtered.length} Collection{filtered.length !== 1 ? 's' : ''}
              </Typography>
              {coveredCount > 0 && (
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Covering {coveredCount.toLocaleString()} fabrics across all books
                </Typography>
              )}
            </Box>
            <TextField
              size="small"
              placeholder="Search collections…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 17, color: '#aaa' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 240,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': { borderColor: '#b8935f' },
                  '&.Mui-focused fieldset': { borderColor: '#b8935f' },
                },
              }}
            />
          </Box>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 14, gap: 2 }}>
            <CircularProgress sx={{ color: '#e3c29a' }} size={38} thickness={3} />
            <Typography variant="body2" sx={{ color: '#999' }}>Loading collections…</Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* No books from data — show a CTA to browse fabrics directly */}
        {!loading && !error && books.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <AutoStoriesIcon sx={{ fontSize: 56, color: '#e3c29a', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1.5 }}>
              Browse Our Fabric Collection
            </Typography>
            <Typography variant="body1" sx={{ color: '#777', mb: 4, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
              Our full catalog of thousands of premium upholstery fabrics — add any to your sample cart and we&apos;ll ship swatches for free.
            </Typography>
            <Button
              component={Link}
              href="/fabrics"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ bgcolor: '#1a1a1a', color: '#e3c29a', fontWeight: 700, borderRadius: '10px', px: 4, py: 1.4, textTransform: 'none', '&:hover': { bgcolor: '#333' } }}
            >
              Shop All Fabrics
            </Button>
          </Box>
        )}

        {/* ── BOOKS GRID ──────────────────────────────────────────── */}
        {!loading && !error && filtered.length > 0 && (
          <Grid container spacing={3}>
            {filtered.map((book) => (
              <Grid item xs={12} sm={6} md={4} key={book.name}>
                <BookCard book={book} />
              </Grid>
            ))}
          </Grid>
        )}

        {filtered.length === 0 && !loading && books.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#555' }}>No collections match &quot;{search}&quot;</Typography>
            <Button onClick={() => setSearch('')} sx={{ mt: 2, color: '#b8935f' }}>Clear search</Button>
          </Box>
        )}

        {/* ── BOTTOM CTA ──────────────────────────────────────────── */}
        {!loading && (
          <Box
            sx={{
              mt: 8,
              p: { xs: 3, md: 5 },
              bgcolor: '#1a1a1a',
              borderRadius: '16px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', top: -40, left: '10%', width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(227,194,154,0.08)', filter: 'blur(50px)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'relative' }}>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 1.5 }}>
                Can&apos;t find what you&apos;re looking for?
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.65)', mb: 3.5, maxWidth: 480, mx: 'auto' }}>
                Browse our full catalog of 6,000+ fabrics and add individual swatches to your sample request — all shipped free.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  href="/fabrics"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ bgcolor: '#e3c29a', color: '#000', fontWeight: 700, px: 4, py: 1.25, borderRadius: '8px', textTransform: 'none', '&:hover': { bgcolor: '#d4b087' } }}
                >
                  Browse All Fabrics
                </Button>
                <Button
                  component={Link}
                  href="/request-samples"
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', fontWeight: 600, px: 4, py: 1.25, borderRadius: '8px', textTransform: 'none', '&:hover': { borderColor: '#e3c29a', color: '#e3c29a', bgcolor: 'transparent' } }}
                >
                  View Sample Cart
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}

// ── Book card ────────────────────────────────────────────────────────────────
function BookCard({ book }: { book: SampleBook }) {
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.13)',
        },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 2×2 image mosaic */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', aspectRatio: '16/9', overflow: 'hidden' }}>
        {[0, 1, 2, 3].map((i) => {
          const src = book.previewImages[i];
          return (
            <Box key={i} sx={{ bgcolor: '#ede9e3', overflow: 'hidden', position: 'relative' }}>
              {src && !imgErrors[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={`${book.name} fabric preview ${i + 1}`}
                  loading="lazy"
                  onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AutoStoriesIcon sx={{ color: '#ccc', fontSize: 22 }} />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Info */}
      <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Chip
          label={`${book.fabricCount} fabric${book.fabricCount !== 1 ? 's' : ''}`}
          size="small"
          sx={{ alignSelf: 'flex-start', mb: 1.25, bgcolor: '#f5f0e8', color: '#b8935f', fontWeight: 700, fontSize: '0.7rem', height: 22, '& .MuiChip-label': { px: 1 } }}
        />
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 800, color: '#1a1a1a', mb: 0.5, lineHeight: 1.3, fontSize: '0.95rem' }}
        >
          {book.name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', fontSize: '0.78rem', mb: 2.5, lineHeight: 1.5 }}>
          Browse {book.fabricCount} curated fabric{book.fabricCount !== 1 ? 's' : ''} from this collection.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
          <Button
            component={Link}
            href={`/fabrics?sampleBook=${encodeURIComponent(book.name)}`}
            variant="contained"
            size="small"
            fullWidth
            sx={{ bgcolor: '#1a1a1a', color: '#e3c29a', fontWeight: 700, borderRadius: '7px', textTransform: 'none', fontSize: '0.8rem', py: 0.9, '&:hover': { bgcolor: '#333' } }}
          >
            Browse Fabrics
          </Button>
          <Button
            component={Link}
            href="/request-samples"
            variant="outlined"
            size="small"
            sx={{ borderColor: 'rgba(0,0,0,0.15)', color: '#555', fontWeight: 600, borderRadius: '7px', textTransform: 'none', fontSize: '0.8rem', py: 0.9, whiteSpace: 'nowrap', flexShrink: 0, '&:hover': { borderColor: '#b8935f', color: '#b8935f', bgcolor: 'transparent' } }}
          >
            Samples
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
