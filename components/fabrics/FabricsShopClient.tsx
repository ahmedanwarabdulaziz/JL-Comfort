'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
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
  Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CharlotteFabricSnapshotItem, CharlotteFabricFilters } from '@/lib/types/charlotteFabric';
import { getCharlotteFabricsSnapshot, filterFabrics } from '@/lib/data/charlotteFabricCatalog';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
  FabricFacetOption,
} from '@/lib/data/charlotteFabricFacets';
import FabricCard from './FabricCard';

const PAGE_SIZE = 32;
const SIDEBAR_WIDTH = 280;

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
          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
          userSelect: 'none',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#1a1a1a', fontSize: '0.75rem' }}
        >
          {title}
        </Typography>
        {open ? (
          <ExpandLessIcon sx={{ fontSize: 18, color: '#888' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 18, color: '#888' }} />
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
  filters,
  toggleFilter,
  search,
  setSearch,
  activeCount,
  onClearAll,
  dynamicOptions,
}: {
  filters: Record<string, string[]>;
  toggleFilter: (category: string, value: string) => void;
  search: string;
  setSearch: (v: string) => void;
  activeCount: number;
  onClearAll: () => void;
  dynamicOptions: Record<string, FabricFacetOption[]>;
}) {

  const renderFilterList = (categoryKey: string, options: FabricFacetOption[], isColor = false) => {
    if (!options || options.length === 0) return null;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {options.map((opt) => {
          const active = filters[categoryKey]?.includes(opt.value);
          return (
            <Box
              key={opt.value}
              onClick={() => toggleFilter(categoryKey, opt.value)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 0.5,
                py: 0.2,
                borderRadius: '4px',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                transition: 'background 0.15s',
              }}
            >
              <Checkbox
                checked={active}
                size="small"
                disableRipple
                sx={{
                  color: 'rgba(0,0,0,0.2)',
                  p: 0.5,
                  '&.Mui-checked': { color: '#1a1a1a' },
                }}
              />
              {isColor && (
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: COLOR_DOT[opt.value] ?? '#ccc',
                    border: opt.value === 'white-ivory' ? '1px solid #ccc' : '1px solid rgba(0,0,0,0.1)',
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography
                variant="body2"
                sx={{ fontSize: '0.85rem', color: active ? '#1a1a1a' : '#444', fontWeight: active ? 500 : 400 }}
              >
                {opt.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a', letterSpacing: 0.5 }}>
            FILTER FABRICS
          </Typography>
          {activeCount > 0 && (
            <Button
              size="small"
              onClick={onClearAll}
              sx={{ color: '#1a1a1a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', minWidth: 'auto', p: 0, '&:hover': { bgcolor: 'transparent', color: '#8A7350' } }}
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
              borderRadius: 0,
              fontSize: '0.85rem',
              '&:hover fieldset': { borderColor: '#1a1a1a' },
              '&.Mui-focused fieldset': { borderColor: '#1a1a1a' },
            },
          }}
        />
      </Box>

      <Divider />

      {/* Scrollable filter sections */}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        <SidebarSection title="Color" defaultOpen>
          {renderFilterList('color', CHARLOTTE_FABRIC_COLORS, true)}
        </SidebarSection>
        <SidebarSection title="Pattern" defaultOpen>
          {renderFilterList('pattern', CHARLOTTE_FABRIC_PATTERNS)}
        </SidebarSection>
        <SidebarSection title="Material" defaultOpen>
          {renderFilterList('material', CHARLOTTE_FABRIC_MATERIALS)}
        </SidebarSection>
        
        {dynamicOptions.application?.length > 0 && (
          <SidebarSection title="Application" defaultOpen={false}>
            {renderFilterList('application', dynamicOptions.application)}
          </SidebarSection>
        )}
        
        {dynamicOptions.market?.length > 0 && (
          <SidebarSection title="Market" defaultOpen={false}>
            {renderFilterList('market', dynamicOptions.market)}
          </SidebarSection>
        )}

        {dynamicOptions.features?.length > 0 && (
          <SidebarSection title="Features" defaultOpen={false}>
            {renderFilterList('features', dynamicOptions.features)}
          </SidebarSection>
        )}

        {dynamicOptions.performance?.length > 0 && (
          <SidebarSection title="Performance" defaultOpen={false}>
            {renderFilterList('performance', dynamicOptions.performance)}
          </SidebarSection>
        )}

        {dynamicOptions.fiberContent?.length > 0 && (
          <SidebarSection title="Fiber Content" defaultOpen={false}>
            {renderFilterList('fiberContent', dynamicOptions.fiberContent)}
          </SidebarSection>
        )}

        {dynamicOptions.durability?.length > 0 && (
          <SidebarSection title="Rub Count" defaultOpen={false}>
            {renderFilterList('durability', dynamicOptions.durability)}
          </SidebarSection>
        )}

        {dynamicOptions.patternDirection?.length > 0 && (
          <SidebarSection title="Pattern Direction" defaultOpen={false}>
            {renderFilterList('patternDirection', dynamicOptions.patternDirection)}
          </SidebarSection>
        )}
      </Box>
    </Box>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function FabricsShopClient() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();

  const getArrayParam = (key: string) => {
    const val = searchParams?.get(key);
    return val ? val.split(',') : [];
  };

  const [filters, setFilters] = useState<Record<string, string[]>>({
    color: getArrayParam('color'),
    pattern: getArrayParam('pattern'),
    material: getArrayParam('material'),
    application: getArrayParam('application'),
    market: getArrayParam('market'),
    features: getArrayParam('features'),
    performance: getArrayParam('performance'),
    fiberContent: getArrayParam('fiberContent'),
    durability: getArrayParam('durability'),
    patternDirection: getArrayParam('patternDirection'),
  });

  const toggleFilter = useCallback((category: string, value: string) => {
    setFilters(prev => {
      const current = prev[category] || [];
      return {
        ...prev,
        [category]: current.includes(value) ? current.filter(v => v !== value) : [...current, value]
      };
    });
  }, []);

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

  // Dynamically extract options from allFabrics for the non-hardcoded categories
  const dynamicOptions = useMemo(() => {
    const extract = (key: keyof CharlotteFabricSnapshotItem, isArray = false) => {
      const set = new Set<string>();
      allFabrics.forEach(f => {
        const val = f[key];
        if (!val) return;
        if (isArray) {
          (val as string[]).forEach(v => set.add(v));
        } else {
          set.add(val as string);
        }
      });
      return Array.from(set).sort().map(v => ({ value: v, label: v }));
    };

    return {
      application: extract('applications', true),
      market: extract('markets', true),
      features: extract('features'),
      performance: extract('performance'),
      fiberContent: extract('fiberContent'),
      durability: extract('durability'),
      patternDirection: extract('patternDirection'),
    };
  }, [allFabrics]);

  const filtered = useMemo(() => {
    const filtersObj: CharlotteFabricFilters = {
      color: filters.color,
      pattern: filters.pattern,
      material: filters.material,
      application: filters.application,
      market: filters.market,
      features: filters.features,
      performance: filters.performance,
      fiberContent: filters.fiberContent,
      durability: filters.durability,
      patternDirection: filters.patternDirection,
      search,
      sampleBook: sampleBook || undefined,
    };
    return filterFabrics(allFabrics, filtersObj);
  }, [allFabrics, filters, search, sampleBook]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filters, search]);

  const visibleFabrics = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  
  // Calculate total active filter chips
  const activeCount = Object.values(filters).reduce((acc, arr) => acc + arr.length, 0) + (search ? 1 : 0);

  const clearAll = () => { 
    setFilters({
      color: [], pattern: [], material: [], application: [], market: [], features: [], performance: [], fiberContent: [], durability: [], patternDirection: []
    }); 
    setSearch(''); 
  };

  const sidebarProps = { filters, toggleFilter, search, setSearch, activeCount, onClearAll: clearAll, dynamicOptions };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: '#FAFAFA',
          pt: { xs: 8, md: 10 },
          pb: { xs: 6, md: 8 },
          textAlign: 'center',
          borderBottom: '1px solid #eaeaea',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="overline" sx={{ color: '#8A7350', letterSpacing: 2.5, fontWeight: 600, fontSize: '0.75rem', display: 'block', mb: 1 }}>
            Premium Collection
          </Typography>
          <Typography variant="h3" component="h1" sx={{ color: '#1a1a1a', fontWeight: 300, fontSize: { xs: '2.5rem', md: '3.5rem' }, mb: 2 }}>
            Shop{' '}<Box component="span" sx={{ fontWeight: 600 }}>Fabrics</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', maxWidth: 500, mx: 'auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Explore thousands of exquisite upholstery fabrics. Exceptional quality, per-yard pricing, and free samples available.
          </Typography>
        </Container>
      </Box>

      {/* ── BODY: SIDEBAR + GRID ─────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        <Box sx={{ display: 'flex', gap: { md: 6 }, alignItems: 'flex-start' }}>

          {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
          {!isMobile && (
            <Box
              component="aside"
              sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                position: 'sticky',
                top: 24,
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                bgcolor: '#fff',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#eaeaea', borderRadius: 4 },
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
                mb: 4,
                flexWrap: 'wrap',
                gap: 2,
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
                    borderRadius: 0,
                    borderColor: '#1a1a1a',
                    color: '#1a1a1a',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    letterSpacing: 1,
                  }}
                >
                  Filters{activeCount > 0 ? ` (${activeCount})` : ''}
                </Button>
              )}

              {/* Count */}
              {!loading && !error && (
                <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {filtered.length.toLocaleString()} fabric{filtered.length !== 1 ? 's' : ''}
                </Typography>
              )}

              {/* Active filter chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 'auto' }}>
                {search && (
                  <Chip
                    label={`"${search}"`}
                    size="small"
                    onDelete={() => setSearch('')}
                    sx={{ bgcolor: '#f4f4f4', color: '#1a1a1a', fontSize: '0.75rem', fontWeight: 500, borderRadius: 1 }}
                  />
                )}
                {Object.entries(filters).map(([key, values]) => (
                  values.map(val => {
                    // Try to find a human readable label if it's one of the hardcoded facets
                    let label = val;
                    if (key === 'color') label = CHARLOTTE_FABRIC_COLORS.find(c => c.value === val)?.label || val;
                    if (key === 'pattern') label = CHARLOTTE_FABRIC_PATTERNS.find(c => c.value === val)?.label || val;
                    if (key === 'material') label = CHARLOTTE_FABRIC_MATERIALS.find(c => c.value === val)?.label || val;
                    
                    return (
                      <Chip
                        key={`${key}-${val}`}
                        label={label}
                        size="small"
                        onDelete={() => toggleFilter(key, val)}
                        sx={{ bgcolor: '#f4f4f4', color: '#1a1a1a', fontSize: '0.75rem', fontWeight: 500, borderRadius: 1 }}
                      />
                    );
                  })
                ))}
              </Box>
            </Box>

            {/* Loading */}
            {loading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 16, gap: 2 }}>
                <CircularProgress sx={{ color: '#1a1a1a' }} size={38} thickness={2} />
              </Box>
            )}

            {/* Error */}
            {error && !loading && (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                <Button variant="outlined" onClick={() => window.location.reload()} sx={{ borderColor: '#1a1a1a', color: '#1a1a1a', borderRadius: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Retry
                </Button>
              </Box>
            )}

            {/* Empty */}
            {!loading && !error && visibleFabrics.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 14 }}>
                <Typography variant="h5" sx={{ color: '#1a1a1a', mb: 1, fontWeight: 300 }}>No fabrics found</Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>Try removing some filters to see more results.</Typography>
                <Button onClick={clearAll} variant="outlined" sx={{ borderColor: '#1a1a1a', color: '#1a1a1a', borderRadius: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Clear all filters
                </Button>
              </Box>
            )}

            {/* Grid */}
            {!loading && !error && visibleFabrics.length > 0 && (
              <>
                <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                  {visibleFabrics.map((fabric) => (
                    <Grid item xs={6} sm={4} md={4} lg={3} key={fabric.id}>
                      <FabricCard fabric={fabric} />
                    </Grid>
                  ))}
                </Grid>

                {hasMore && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      sx={{
                        borderColor: '#1a1a1a',
                        color: '#1a1a1a',
                        borderRadius: 0,
                        px: 6,
                        py: 1.5,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        fontSize: '0.85rem',
                        '&:hover': { bgcolor: '#1a1a1a', color: '#fff' },
                      }}
                    >
                      Load More ({filtered.length - visibleCount} remaining)
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
            width: 320,
            bgcolor: '#fff',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>FILTER FABRICS</Typography>
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
            disableElevation
            sx={{ bgcolor: '#1a1a1a', color: '#fff', fontWeight: 500, borderRadius: 0, py: 1.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem', '&:hover': { bgcolor: '#333' } }}
          >
            View {filtered.length.toLocaleString()} Fabrics
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
