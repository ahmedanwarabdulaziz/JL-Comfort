'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CharlotteFabricSnapshotItem, CharlotteFabricFilters } from '@/lib/types/charlotteFabric';
import { getCharlotteFabricsSnapshot, filterFabrics } from '@/lib/data/charlotteFabricCatalog';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
  FabricFacetOption,
} from '@/lib/data/charlotteFabricFacets';
import { brand } from '@/lib/theme';
import FabricCard, { CardColourway } from './FabricCard';
import { cleanBookName } from './SampleBookCover';

const PAGE_SIZE = 32;
const SIDEBAR_WIDTH = 272;
const HEADER_OFFSET = 89; // sticky site header (65px) + breathing room
const LINE = '#e5e0d9';
const MUTED = '#8b857e';

// Dot colours for the colour facet.
export const COLOR_DOT: Record<string, string> = {
  'red-burgundy': '#8B1A2B',
  'orange-rust': '#C2612A',
  'gold-yellow': '#D4A017',
  green: '#3A7A47',
  'aqua-teal': '#2A8A8A',
  blue: '#2A5FA8',
  purple: '#6A3A9A',
  'coral-peach': '#E07060',
  pink: '#D4608A',
  'beige-taupe': '#B8A898',
  brown: '#6B4226',
  black: '#1A1A1A',
  'grey-silver': '#8A8A8A',
  'white-ivory': '#F0EDE5',
};

type FilterKey =
  | 'color'
  | 'pattern'
  | 'material'
  | 'application'
  | 'market'
  | 'features'
  | 'performance'
  | 'fiberContent'
  | 'durability'
  | 'patternDirection';

const FILTER_KEYS: FilterKey[] = ['color', 'pattern', 'material', 'application', 'market', 'features', 'performance', 'fiberContent', 'durability', 'patternDirection'];

const SECTION_TITLES: Record<FilterKey, string> = {
  color: 'Colour',
  pattern: 'Pattern',
  material: 'Material',
  application: 'Use',
  market: 'Market',
  features: 'Features',
  performance: 'Performance',
  fiberContent: 'Content',
  durability: 'Rub count',
  patternDirection: 'Pattern direction',
};

const STATIC_OPTIONS: Partial<Record<FilterKey, FabricFacetOption[]>> = {
  color: CHARLOTTE_FABRIC_COLORS,
  pattern: CHARLOTTE_FABRIC_PATTERNS,
  material: CHARLOTTE_FABRIC_MATERIALS,
};

const optionLabel = (key: FilterKey, value: string) => STATIC_OPTIONS[key]?.find((o) => o.value === value)?.label || value;

type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';
const SORTS: Record<SortKey, string> = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  name: 'Name: A to Z',
};

const sortFabrics = (fabrics: CharlotteFabricSnapshotItem[], sort: SortKey) => {
  if (sort === 'featured') return fabrics;
  const list = fabrics.slice();
  const price = (f: CharlotteFabricSnapshotItem) => f.pricePerYard;
  switch (sort) {
    case 'newest':
      return list.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime());
    case 'price-asc':
      return list.sort((a, b) => (price(a) ?? Infinity) - (price(b) ?? Infinity));
    case 'price-desc':
      return list.sort((a, b) => (price(b) ?? -Infinity) - (price(a) ?? -Infinity));
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name));
  }
};

// ─── Filter section: one open at a time; closed sections list what's selected ──
function FilterSection({
  title,
  open,
  onToggle,
  selected,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  selected: string[];
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ borderBottom: `1px solid ${LINE}` }}>
      <Box
        component="button"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          px: 0,
          bgcolor: 'transparent',
          border: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          color: brand.ink,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {title}
            {selected.length > 0 && (
              <Box component="span" sx={{ ml: 0.75, px: 0.75, py: '1px', bgcolor: brand.ink, color: brand.chalk, fontSize: '0.62rem', letterSpacing: 0 }}>
                {selected.length}
              </Box>
            )}
          </Typography>
          {!open && selected.length > 0 && (
            <Typography sx={{ mt: 0.4, fontSize: '0.78rem', color: brand.mocha, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.join(', ')}
            </Typography>
          )}
        </Box>
        <ExpandMoreIcon sx={{ fontSize: 20, color: MUTED, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </Box>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ pb: 1.75 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}

// ─── Sidebar (desktop + mobile drawer) ───────────────────────────────────────
function SidebarContent({
  filters,
  toggleFilter,
  search,
  setSearch,
  activeCount,
  onClearAll,
  options,
  counts,
}: {
  filters: Record<FilterKey, string[]>;
  toggleFilter: (category: FilterKey, value: string) => void;
  search: string;
  setSearch: (v: string) => void;
  activeCount: number;
  onClearAll: () => void;
  options: Record<FilterKey, FabricFacetOption[]>;
  counts: Record<FilterKey, Record<string, number>>;
}) {
  const sections = FILTER_KEYS.filter((key) => options[key].length > 0);
  const [openKey, setOpenKey] = useState<FilterKey | null>(() => sections.find((key) => filters[key].length > 0) || 'color');

  const renderOptions = (key: FilterKey) => {
    // Hide options no fabric has; keep a selected one visible so it can be unticked.
    const list = options[key].filter((opt) => (counts[key][opt.value] ?? 0) > 0 || filters[key].includes(opt.value));
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
        {list.map((opt) => {
          const active = filters[key].includes(opt.value);
          const count = counts[key][opt.value];
          return (
            <Box
              key={opt.value}
              component="label"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25, cursor: 'pointer', '&:hover .opt-label': { color: brand.mocha } }}
            >
              <Checkbox
                checked={active}
                onChange={() => toggleFilter(key, opt.value)}
                size="small"
                disableRipple
                sx={{ p: 0.5, color: '#c9c2ba', '&.Mui-checked': { color: brand.ink } }}
              />
              {key === 'color' && (
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: COLOR_DOT[opt.value] ?? '#ccc',
                    border: opt.value === 'white-ivory' ? '1px solid #ccc' : '1px solid rgba(0,0,0,0.1)',
                  }}
                />
              )}
              <Typography className="opt-label" sx={{ fontSize: '0.86rem', color: active ? brand.ink : '#4a4540', fontWeight: active ? 600 : 400, transition: 'color .15s' }}>
                {opt.label}
                {count !== undefined && (
                  <Box component="span" sx={{ color: MUTED, ml: 0.6, fontSize: '0.74rem', fontWeight: 400 }}>
                    ({count.toLocaleString()})
                  </Box>
                )}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: brand.ink }}>Filter by</Typography>
        {activeCount > 0 && (
          <Button size="small" onClick={onClearAll} sx={{ p: 0, minWidth: 0, fontSize: '0.7rem', color: brand.mocha, '&:hover': { bgcolor: 'transparent', color: brand.ink } }}>
            Clear all
          </Button>
        )}
      </Box>
      <TextField
        size="small"
        fullWidth
        placeholder="Search name or pattern #"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 17, color: MUTED }} />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearch('')} edge="end" aria-label="Clear search">
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        sx={{ mb: 1, '& .MuiOutlinedInput-root': { fontSize: '0.86rem', '&.Mui-focused fieldset': { borderColor: brand.ink } } }}
      />
      <Box sx={{ borderTop: `1px solid ${LINE}` }}>
        {sections.map((key) => (
          <FilterSection
            key={key}
            title={SECTION_TITLES[key]}
            open={openKey === key}
            onToggle={() => setOpenKey((current) => (current === key ? null : key))}
            selected={filters[key].map((value) => optionLabel(key, value))}
          >
            {renderOptions(key)}
          </FilterSection>
        ))}
      </Box>
    </Box>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
const emptyFilters = (): Record<FilterKey, string[]> =>
  Object.fromEntries(FILTER_KEYS.map((key) => [key, []])) as unknown as Record<FilterKey, string[]>;

export default function FabricsShopClient() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Record<FilterKey, string[]>>(() => {
    const initial = emptyFilters();
    for (const key of FILTER_KEYS) {
      const value = searchParams?.get(key);
      if (value) initial[key] = value.split(',');
    }
    return initial;
  });
  const [sampleBook, setSampleBook] = useState(searchParams?.get('sampleBook') ?? '');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('featured');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [allFabrics, setAllFabrics] = useState<CharlotteFabricSnapshotItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleFilter = useCallback((category: FilterKey, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value) ? prev[category].filter((v) => v !== value) : [...prev[category], value],
    }));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCharlotteFabricsSnapshot()
      .then(setAllFabrics)
      .catch((err) => {
        console.error('Error loading fabric catalog:', err);
        setError('Failed to load fabrics. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Options for every filter group: fixed lists for colour/pattern/material, the rest from the data.
  const options = useMemo(() => {
    const extract = (key: keyof CharlotteFabricSnapshotItem) => {
      const set = new Set<string>();
      allFabrics.forEach((f) => {
        const val = f[key];
        if (Array.isArray(val)) val.forEach((v) => v && set.add(v));
        else if (typeof val === 'string' && val) set.add(val);
      });
      return Array.from(set).sort().map((v) => ({ value: v, label: v }));
    };
    return {
      color: CHARLOTTE_FABRIC_COLORS,
      pattern: CHARLOTTE_FABRIC_PATTERNS,
      material: CHARLOTTE_FABRIC_MATERIALS,
      application: extract('applications'),
      market: extract('markets'),
      features: extract('features'),
      performance: extract('performance'),
      fiberContent: extract('fiberContent'),
      durability: extract('durability'),
      patternDirection: extract('patternDirection'),
    } as Record<FilterKey, FabricFacetOption[]>;
  }, [allFabrics]);

  // How many fabrics carry each option (catalog-wide).
  const counts = useMemo(() => {
    const fieldFor: Record<FilterKey, keyof CharlotteFabricSnapshotItem> = {
      color: 'color',
      pattern: 'pattern',
      material: 'material',
      application: 'applications',
      market: 'markets',
      features: 'features',
      performance: 'performance',
      fiberContent: 'fiberContent',
      durability: 'durability',
      patternDirection: 'patternDirection',
    };
    const result = Object.fromEntries(FILTER_KEYS.map((key) => [key, {} as Record<string, number>])) as Record<FilterKey, Record<string, number>>;
    for (const f of allFabrics) {
      for (const key of FILTER_KEYS) {
        const val = f[fieldFor[key]];
        const values = Array.isArray(val) ? val : typeof val === 'string' && val ? [val] : [];
        for (const v of values) result[key][v] = (result[key][v] || 0) + 1;
      }
    }
    return result;
  }, [allFabrics]);

  // Colourway thumbnails for each card, from fabrics sharing a colourway group.
  const colourwaysByGroup = useMemo(() => {
    const groups = new Map<string, CardColourway[]>();
    for (const f of allFabrics) {
      if (!f.colorwayGroup || !f.imageUrl) continue;
      const list = groups.get(f.colorwayGroup) || [];
      list.push({ id: f.id, name: f.name, imageUrl: f.imageUrl });
      groups.set(f.colorwayGroup, list);
    }
    return groups;
  }, [allFabrics]);

  const filtered = useMemo(() => {
    const filtersObj: CharlotteFabricFilters = { ...filters, search, sampleBook: sampleBook || undefined };
    return sortFabrics(filterFabrics(allFabrics, filtersObj), sort);
  }, [allFabrics, filters, search, sampleBook, sort]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters, search, sort, sampleBook]);

  const bookLabel = sampleBook ? cleanBookName(sampleBook) : '';
  const visibleFabrics = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const activeCount = FILTER_KEYS.reduce((acc, key) => acc + filters[key].length, 0) + (search ? 1 : 0) + (sampleBook ? 1 : 0);

  const clearAll = () => {
    setFilters(emptyFilters());
    setSearch('');
    setSampleBook('');
  };

  const sidebarProps = { filters, toggleFilter, search, setSearch, activeCount, onClearAll: clearAll, options, counts };
  const chipSx = { bgcolor: brand.chalk, color: brand.ink, borderRadius: 0, fontSize: '0.76rem', border: `1px solid ${LINE}` };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <Box sx={{ bgcolor: brand.chalk, borderBottom: `1px solid ${LINE}` }}>
        <Container maxWidth="xl" sx={{ py: { xs: 3.5, md: 5 } }}>
          <Typography sx={{ fontSize: '0.74rem', color: MUTED, mb: 1.5 }}>
            <Box component={Link} href="/" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: brand.mocha } }}>Home</Box>
            <Box component="span" sx={{ mx: 0.75 }}>›</Box>
            <Box component="span" sx={{ color: brand.ink }}>Fabrics</Box>
            {sampleBook && (
              <>
                <Box component="span" sx={{ mx: 0.75 }}>›</Box>
                <Box component="span" sx={{ color: brand.ink }}>{bookLabel}</Box>
              </>
            )}
          </Typography>
          <Typography component="h1" variant="h1" sx={{ fontSize: { xs: '2.1rem', md: '2.9rem' }, color: brand.ink }}>
            {sampleBook ? (
              <>
                {bookLabel} <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.mocha }}>collection</Box>
              </>
            ) : (
              <>
                Designer <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400, color: brand.mocha }}>fabrics</Box>
              </>
            )}
          </Typography>
          <Typography sx={{ color: brand.textSecondary, maxWidth: 620, mt: 1.25, lineHeight: 1.7 }}>
            Upholstery and multipurpose fabric by the yard, priced in Canadian dollars. Order a free sample of any fabric before you buy.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ display: 'flex', gap: { md: 5 }, alignItems: 'flex-start' }}>
          {/* ── Desktop sidebar ──────────────────────────────── */}
          {!isMobile && (
            <Box
              component="aside"
              sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                position: 'sticky',
                top: HEADER_OFFSET,
                maxHeight: `calc(100vh - ${HEADER_OFFSET + 16}px)`,
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: LINE, borderRadius: 4 },
              }}
            >
              <SidebarContent {...sidebarProps} />
            </Box>
          )}

          {/* ── Results ─────────────────────────────────────── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', pb: 2, borderBottom: `1px solid ${LINE}` }}>
              {isMobile && (
                <Button startIcon={<TuneIcon />} onClick={() => setMobileDrawerOpen(true)} variant="outlined" size="small" sx={{ borderColor: brand.ink, color: brand.ink }}>
                  Filters{activeCount > 0 ? ` (${activeCount})` : ''}
                </Button>
              )}
              <Typography sx={{ color: brand.textSecondary, fontSize: '0.9rem' }}>
                {loading ? 'Loading fabrics…' : `${filtered.length.toLocaleString()} fabric${filtered.length === 1 ? '' : 's'}`}
              </Typography>
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: MUTED, display: { xs: 'none', sm: 'block' } }}>Sort by</Typography>
                <Select size="small" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} sx={{ fontSize: '0.86rem', minWidth: 170 }}>
                  {(Object.keys(SORTS) as SortKey[]).map((key) => (
                    <MenuItem key={key} value={key} sx={{ fontSize: '0.86rem' }}>{SORTS[key]}</MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            {/* Active filters */}
            {activeCount > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', pt: 2 }}>
                {sampleBook && <Chip size="small" label={`Collection: ${bookLabel}`} onDelete={() => setSampleBook('')} sx={chipSx} />}
                {search && <Chip size="small" label={`"${search}"`} onDelete={() => setSearch('')} sx={chipSx} />}
                {FILTER_KEYS.flatMap((key) =>
                  filters[key].map((value) => (
                    <Chip key={`${key}-${value}`} size="small" label={optionLabel(key, value)} onDelete={() => toggleFilter(key, value)} sx={chipSx} />
                  ))
                )}
                <Button size="small" onClick={clearAll} sx={{ fontSize: '0.7rem', color: brand.mocha, '&:hover': { bgcolor: 'transparent', color: brand.ink } }}>
                  Clear all
                </Button>
              </Box>
            )}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 16 }}>
                <CircularProgress sx={{ color: brand.ink }} size={36} thickness={2} />
              </Box>
            )}

            {error && !loading && (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                <Button variant="outlined" onClick={() => window.location.reload()} sx={{ borderColor: brand.ink, color: brand.ink }}>Retry</Button>
              </Box>
            )}

            {!loading && !error && visibleFabrics.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 14 }}>
                <Typography variant="h4" sx={{ mb: 1, color: brand.ink }}>No fabrics found</Typography>
                <Typography sx={{ color: brand.textSecondary, mb: 3 }}>Try removing a filter to see more fabrics.</Typography>
                <Button onClick={clearAll} variant="outlined" sx={{ borderColor: brand.ink, color: brand.ink }}>Clear all filters</Button>
              </Box>
            )}

            {!loading && !error && visibleFabrics.length > 0 && (
              <>
                <Box
                  sx={{
                    mt: 3,
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                    columnGap: { xs: 2, md: 3 },
                    rowGap: { xs: 3.5, md: 5 },
                  }}
                >
                  {visibleFabrics.map((fabric) => (
                    <FabricCard
                      key={fabric.id}
                      fabric={fabric}
                      colourways={fabric.colorwayGroup ? colourwaysByGroup.get(fabric.colorwayGroup) : undefined}
                    />
                  ))}
                </Box>

                <Box sx={{ textAlign: 'center', mt: 7 }}>
                  <Typography sx={{ color: MUTED, fontSize: '0.8rem', mb: 1.5 }}>
                    Showing {visibleFabrics.length.toLocaleString()} of {filtered.length.toLocaleString()}
                  </Typography>
                  {hasMore && (
                    <Button
                      variant="outlined"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      sx={{ borderColor: brand.ink, color: brand.ink, px: 6, py: 1.4, '&:hover': { bgcolor: brand.ink, color: brand.chalk } }}
                    >
                      Load more fabrics
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* ── Mobile filter drawer ─────────────────────────────── */}
      <Drawer anchor="left" open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} PaperProps={{ sx: { width: 320, display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.8rem', textTransform: 'uppercase' }}>Filters</Typography>
          <IconButton onClick={() => setMobileDrawerOpen(false)} size="small" aria-label="Close filters">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
          <SidebarContent {...sidebarProps} />
        </Box>
        <Box sx={{ p: 2, borderTop: `1px solid ${LINE}` }}>
          <Button fullWidth variant="contained" disableElevation onClick={() => setMobileDrawerOpen(false)} sx={{ bgcolor: brand.ink, color: brand.chalk, py: 1.4, '&:hover': { bgcolor: brand.mocha } }}>
            View {filtered.length.toLocaleString()} fabrics
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
