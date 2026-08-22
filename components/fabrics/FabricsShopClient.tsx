'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Grid,
  InputAdornment,
  TextField,
  CircularProgress,
  Button,
  Chip,
  IconButton,
  Drawer,
  Divider,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CharlotteFabricSnapshotItem } from '@/lib/types/charlotteFabric';
import { getCharlotteFabricsSnapshot, filterFabrics } from '@/lib/data/charlotteFabricCatalog';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
} from '@/lib/data/charlotteFabricFacets';
import FabricCard from './FabricCard';

const PAGE_SIZE = 32;
const SIDEBAR_WIDTH = 252;

// Dot color map
const COLOR_DOT: Record<string, string> = {
  'red-burgundy':   '#8B1A2B',
  'orange-rust':    '#C2612A',
  'gold-yellow':    '#D4A017',
  'green':          '#3A7A47',
  'aqua-teal':      '#2A8A8A',
  'blue':           '#2A5FA8',
  'purple':         '#6A3A9A',
  'coral-peach':    '#E07060',
  'pink':           '#D4608A',
  'beige-taupe':    '#B8A898',
  'brown':          '#6B4226',
  'black':          '#1A1A1A',
  'grey-silver':    '#8A8A8A',
  'white-ivory':    '#F0EDE5',
};

// ─── Collapsible sidebar section ────────────────────────────────────────────
function SidebarSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box sx={{ mb: 0 }}>
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          py: 1.5,
          px: 2,
          '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
          userSelect: 'none',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#1a1a1a', fontSize: '0.7rem' }}
        >
          {title}
        </Typography>
        {open ? (
          <ExpandLessIcon sx={{ fontSize: 16, color: '#888' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 16, color: '#888' }} />
        )}
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2 }}>{children}</Box>
      </Collapse>
      <Divider />
    </Box>
  );
}

// ─── The sidebar content (reused in both desktop + mobile drawer) ────────────
function SidebarContent({
  color, setColor,
  pattern, setPattern,
  material, setMaterial,
  search, setSearch,
  activeCount,
  onClearAll,
}: {
  color: string; setColor: (v: string) => void;
  pattern: string; setPattern: (v: string) => void;
  material: string; setMaterial: (v: string) => void;
  search: string; setSearch: (v: string) => void;
  activeCount: number;
  onClearAll: () => void;
}) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a1a1a', letterSpacing: 0.5 }}>
            FILTER FABRICS
          </Typography>
          {activeCount > 0 && (
            <Button
              size="small"
              onClick={onClearAll}
              sx={{ color: '#b8935f', fontWeight: 700, textTransform: 'none', fontSize: '0.75rem', minWidth: 'auto', p: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
            >
              Clear all
            </Button>
          )}
        </Box>

        {/* Search */}
        <TextField
          size="small"
          fullWidth
          placeholder="Search name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: '#aaa' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')} edge="end" sx={{ mr: -0.5 }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: '0.82rem',
              '&:hover fieldset': { borderColor: '#b8935f' },
              '&.Mui-focused fieldset': { borderColor: '#b8935f' },
            },
          }}
        />
      </Box>

      <Divider />

      {/* Scrollable filter sections */}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>

        {/* COLOR */}
        <SidebarSection title="Color" defaultOpen>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {CHARLOTTE_FABRIC_COLORS.map((c) => {
              const active = color === c.value;
              return (
                <Box
                  key={c.value}
                  onClick={() => setColor(active ? '' : c.value)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1,
                    py: 0.6,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    bgcolor: active ? 'rgba(184,147,95,0.1)' : 'transparent',
                    '&:hover': { bgcolor: active ? 'rgba(184,147,95,0.15)' : 'rgba(0,0,0,0.04)' },
                    transition: 'background 0.15s',
                  }}
                >
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: COLOR_DOT[c.value] ?? '#ccc',
                      border: c.value === 'white-ivory' ? '1.5px solid #ccc' : '1.5px solid rgba(0,0,0,0.1)',
                      flexShrink: 0,
                      boxShadow: active ? '0 0 0 2px #b8935f' : 'none',
                      transition: 'box-shadow 0.15s',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.82rem', color: active ? '#b8935f' : '#444', fontWeight: active ? 700 : 400, lineHeight: 1.3 }}
                  >
                    {c.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </SidebarSection>

        {/* PATTERN */}
        <SidebarSection title="Pattern" defaultOpen={false}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {CHARLOTTE_FABRIC_PATTERNS.map((p) => {
              const active = pattern === p.value;
              return (
                <Box
                  key={p.value}
                  onClick={() => setPattern(active ? '' : p.value)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    py: 0.6,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    bgcolor: active ? 'rgba(184,147,95,0.1)' : 'transparent',
                    '&:hover': { bgcolor: active ? 'rgba(184,147,95,0.15)' : 'rgba(0,0,0,0.04)' },
                    transition: 'background 0.15s',
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: active ? '#b8935f' : '#ccc',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.82rem', color: active ? '#b8935f' : '#444', fontWeight: active ? 700 : 400, lineHeight: 1.3 }}
                  >
                    {p.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </SidebarSection>

        {/* MATERIAL */}
        <SidebarSection title="Material" defaultOpen={false}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {CHARLOTTE_FABRIC_MATERIALS.map((m) => {
              const active = material === m.value;
              return (
                <Box
                  key={m.value}
                  onClick={() => setMaterial(active ? '' : m.value)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    py: 0.6,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    bgcolor: active ? 'rgba(184,147,95,0.1)' : 'transparent',
                    '&:hover': { bgcolor: active ? 'rgba(184,147,95,0.15)' : 'rgba(0,0,0,0.04)' },
                    transition: 'background 0.15s',
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: active ? '#b8935f' : '#ccc',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.82rem', color: active ? '#b8935f' : '#444', fontWeight: active ? 700 : 400, lineHeight: 1.3 }}
                  >
                    {m.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </SidebarSection>

      </Box>
    </Box>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function FabricsShopClient() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();

  const [color, setColor] = useState(searchParams?.get('color') ?? '');
  const [pattern, setPattern] = useState(searchParams?.get('pattern') ?? '');
  const [material, setMaterial] = useState(searchParams?.get('material') ?? '');
  const [sampleBook] = useState(searchParams?.get('sampleBook') ?? '');
  const [search, setSearch] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [allFabrics, setAllFabrics] = useState<CharlotteFabricSnapshotItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCharlotteFabricsSnapshot()
      .then(setAllFabrics)
      .catch((err) => {
        console.error('Error loading Charlotte Fabrics catalog:', err);
        setError('Failed to load fabrics. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => filterFabrics(allFabrics, { color, pattern, material, search, sampleBook: sampleBook || undefined }),
    [allFabrics, color, pattern, material, search, sampleBook]
  );

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [color, pattern, material, search]);

  const visibleFabrics = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const activeCount = [color, pattern, material, search].filter(Boolean).length;

  const clearAll = () => { setColor(''); setPattern(''); setMaterial(''); setSearch(''); };

  const sidebarProps = { color, setColor, pattern, setPattern, material, setMaterial, search, setSearch, activeCount, onClearAll: clearAll };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9f7f4' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(160deg, #171310 0%, #0a0908 60%, #000 100%)',
          pt: { xs: 6, md: 7 },
          pb: { xs: 5, md: 6 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -60, left: '20%', width: 280, height: 280, borderRadius: '50%', bgcolor: 'rgba(227,194,154,0.08)', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -40, right: '15%', width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(227,194,154,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Typography variant="overline" sx={{ color: '#e3c29a', letterSpacing: 2.5, fontWeight: 700, fontSize: '0.68rem', display: 'block', mb: 1 }}>
            Premium Collection
          </Typography>
          <Typography variant="h3" component="h1" sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '2rem', md: '2.8rem' }, mb: 1.5 }}>
            Shop{' '}<Box component="span" sx={{ color: '#e3c29a' }}>Fabrics</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 500, mx: 'auto', fontSize: '0.95rem' }}>
            Thousands of upholstery fabrics — per-yard pricing, free samples available.
          </Typography>
        </Container>
      </Box>

      {/* ── BODY: SIDEBAR + GRID ─────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ display: 'flex', gap: { md: 4 }, alignItems: 'flex-start' }}>

          {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
          {!isMobile && (
            <Box
              component="aside"
              sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                position: 'sticky',
                top: 16,
                maxHeight: 'calc(100vh - 32px)',
                overflowY: 'auto',
                bgcolor: '#fff',
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#e0d9d0', borderRadius: 4 },
              }}
            >
              <SidebarContent {...sidebarProps} />
            </Box>
          )}

          {/* ── MAIN CONTENT ────────────────────────────────────────── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>

            {/* Results bar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2.5,
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              {/* Mobile: filter button */}
              {isMobile && (
                <Button
                  startIcon={<TuneIcon />}
                  onClick={() => setMobileDrawerOpen(true)}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    borderColor: activeCount > 0 ? '#b8935f' : 'rgba(0,0,0,0.2)',
                    color: activeCount > 0 ? '#b8935f' : '#555',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.82rem',
                  }}
                >
                  Filters{activeCount > 0 ? ` (${activeCount})` : ''}
                </Button>
              )}

              {/* Count */}
              {!loading && !error && (
                <Typography variant="body2" sx={{ color: '#777', fontWeight: 600, fontSize: '0.82rem' }}>
                  {filtered.length.toLocaleString()} fabric{filtered.length !== 1 ? 's' : ''}
                  {activeCount > 0 && <Box component="span" sx={{ color: '#b8935f' }}> — filtered</Box>}
                </Typography>
              )}

              {/* Active filter chips */}
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', ml: 'auto' }}>
                {color && (
                  <Chip
                    label={CHARLOTTE_FABRIC_COLORS.find((c) => c.value === color)?.label ?? color}
                    size="small"
                    onDelete={() => setColor('')}
                    sx={{ bgcolor: '#1a1a1a', color: '#e3c29a', fontSize: '0.72rem', fontWeight: 700, '& .MuiChip-deleteIcon': { color: 'rgba(227,194,154,0.6)', '&:hover': { color: '#e3c29a' } } }}
                  />
                )}
                {pattern && (
                  <Chip
                    label={CHARLOTTE_FABRIC_PATTERNS.find((p) => p.value === pattern)?.label ?? pattern}
                    size="small"
                    onDelete={() => setPattern('')}
                    sx={{ bgcolor: '#1a1a1a', color: '#e3c29a', fontSize: '0.72rem', fontWeight: 700, '& .MuiChip-deleteIcon': { color: 'rgba(227,194,154,0.6)', '&:hover': { color: '#e3c29a' } } }}
                  />
                )}
                {material && (
                  <Chip
                    label={CHARLOTTE_FABRIC_MATERIALS.find((m) => m.value === material)?.label ?? material}
                    size="small"
                    onDelete={() => setMaterial('')}
                    sx={{ bgcolor: '#1a1a1a', color: '#e3c29a', fontSize: '0.72rem', fontWeight: 700, '& .MuiChip-deleteIcon': { color: 'rgba(227,194,154,0.6)', '&:hover': { color: '#e3c29a' } } }}
                  />
                )}
                {search && (
                  <Chip
                    label={`"${search}"`}
                    size="small"
                    onDelete={() => setSearch('')}
                    sx={{ bgcolor: '#1a1a1a', color: '#e3c29a', fontSize: '0.72rem', fontWeight: 700, '& .MuiChip-deleteIcon': { color: 'rgba(227,194,154,0.6)', '&:hover': { color: '#e3c29a' } } }}
                  />
                )}
              </Box>
            </Box>

            {/* Loading */}
            {loading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 16, gap: 2 }}>
                <CircularProgress sx={{ color: '#e3c29a' }} size={38} thickness={3} />
                <Typography variant="body2" sx={{ color: '#999' }}>Loading fabric catalog…</Typography>
              </Box>
            )}

            {/* Error */}
            {error && !loading && (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                <Button variant="outlined" onClick={() => window.location.reload()} sx={{ borderColor: '#b8935f', color: '#b8935f', borderRadius: '8px', textTransform: 'none' }}>
                  Retry
                </Button>
              </Box>
            )}

            {/* Empty */}
            {!loading && !error && visibleFabrics.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 14 }}>
                <Typography variant="h6" sx={{ color: '#555', mb: 1, fontWeight: 700 }}>No fabrics found</Typography>
                <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>Try adjusting your filters.</Typography>
                <Button onClick={clearAll} variant="outlined" sx={{ borderColor: '#b8935f', color: '#b8935f', borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                  Clear all filters
                </Button>
              </Box>
            )}

            {/* Grid */}
            {!loading && !error && visibleFabrics.length > 0 && (
              <>
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }}>
                  {visibleFabrics.map((fabric) => (
                    <Grid item xs={6} sm={4} md={4} lg={3} key={fabric.id}>
                      <FabricCard fabric={fabric} />
                    </Grid>
                  ))}
                </Grid>

                {hasMore && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      sx={{
                        bgcolor: '#1a1a1a',
                        color: '#e3c29a',
                        borderRadius: '10px',
                        px: 5,
                        py: 1.5,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        '&:hover': { bgcolor: '#333' },
                      }}
                    >
                      Load More — {(filtered.length - visibleCount).toLocaleString()} remaining
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* ── MOBILE FILTER DRAWER ────────────────────────────────────── */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            bgcolor: '#fff',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>FILTER FABRICS</Typography>
          <IconButton onClick={() => setMobileDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <SidebarContent {...sidebarProps} />
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setMobileDrawerOpen(false)}
            sx={{ bgcolor: '#1a1a1a', color: '#e3c29a', fontWeight: 700, borderRadius: '10px', py: 1.4, textTransform: 'none', fontSize: '0.9rem', '&:hover': { bgcolor: '#333' } }}
          >
            View {filtered.length.toLocaleString()} Fabrics
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
