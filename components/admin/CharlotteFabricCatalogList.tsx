'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Stack,
  TextField,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Alert,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PublishIcon from '@mui/icons-material/Publish';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EditIcon from '@mui/icons-material/Edit';
import { CharlotteFabric, CharlotteFabricsSyncRun } from '@/lib/types/charlotteFabric';
import {
  getCharlotteFabrics,
  subscribeToLatestSyncRun,
  filterFabrics,
  bulkAssignPriceTag,
  bulkAddToGroup,
  setFabricManualPrice,
  UNTAGGED_PRICE_TAG_FILTER,
} from '@/lib/data/charlotteFabricCatalog';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
} from '@/lib/data/charlotteFabricFacets';
import { FabricPriceTag } from '@/lib/types/fabricPriceTag';
import { getFabricPriceTags } from '@/lib/data/fabricPriceTags';
import { FabricPriceRange, resolvePriceRange } from '@/lib/types/fabricPriceRange';
import { getFabricPriceRanges } from '@/lib/data/fabricPriceRanges';
import { FabricGroup } from '@/lib/types/fabricGroup';
import { getFabricGroups } from '@/lib/data/fabricGroups';

const formatDate = (date: Date | null) => (date ? date.toLocaleString() : '—');

const PHASE_LABELS: Record<CharlotteFabricsSyncRun['phase'], string> = {
  'discovering-catalog': 'Discovering full catalog…',
  'crawling-facets': 'Crawling color/pattern/material facets…',
  'fetching-products': 'Fetching product pages…',
  diffing: 'Checking for removed products…',
  done: 'Done',
};

// If a "running" run hasn't checkpointed in this long, the process likely died without
// reporting failure (e.g. was killed) rather than genuinely still working.
const STALL_THRESHOLD_MS = 3 * 60 * 1000;

export default function CharlotteFabricCatalogList() {
  const [fabrics, setFabrics] = useState<CharlotteFabric[]>([]);
  const [syncRun, setSyncRun] = useState<CharlotteFabricsSyncRun | null>(null);
  const [loading, setLoading] = useState(false);
  // Whether the full ~6,900-doc catalog has been fetched at least once. Loading it costs a full
  // Firestore collection read every time, so it's opt-in rather than automatic on page open —
  // "Publish Pricing" and "Run Sync Now" don't need it, they hit their own server routes.
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const catalogLoadedRef = useRef(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [syncPhase, setSyncPhase] = useState<'all' | 'color' | 'pattern' | 'material'>('all');

  const [search, setSearch] = useState('');
  const [color, setColor] = useState('');
  const [pattern, setPattern] = useState('');
  const [material, setMaterial] = useState('');
  const [application, setApplication] = useState('');
  const [market, setMarket] = useState('');
  const [priceTagFilter, setPriceTagFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [priceRangeFilter, setPriceRangeFilter] = useState('');

  const [priceTags, setPriceTags] = useState<FabricPriceTag[]>([]);
  const [priceRanges, setPriceRanges] = useState<FabricPriceRange[]>([]);
  const [groups, setGroups] = useState<FabricGroup[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignTagDialogOpen, setAssignTagDialogOpen] = useState(false);
  const [assignTagValue, setAssignTagValue] = useState('');
  const [addToGroupDialogOpen, setAddToGroupDialogOpen] = useState(false);
  const [addToGroupValue, setAddToGroupValue] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const [editPriceFabric, setEditPriceFabric] = useState<CharlotteFabric | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [priceSaving, setPriceSaving] = useState(false);

  const loadFabrics = async () => {
    setLoading(true);
    try {
      const fabricResults = await getCharlotteFabrics();
      setFabrics(fabricResults);
      setCatalogLoaded(true);
      catalogLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading Charlotte Fabrics catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [tags, ranges, groupResults] = await Promise.all([
        getFabricPriceTags(),
        getFabricPriceRanges(),
        getFabricGroups(),
      ]);
      setPriceTags(tags);
      setPriceRanges(ranges);
      setGroups(groupResults);
    } catch (error) {
      console.error('Error loading fabric pricing/group reference data:', error);
    }
  };

  useEffect(() => {
    // Reference data (price tags/ranges/groups) is small and needed for the dialogs and stats
    // regardless of whether the full catalog table is loaded, so this stays automatic. The full
    // catalog itself (loadFabrics) is opt-in — see the "Load Catalog" button below.
    loadReferenceData();
  }, []);

  // Live progress: re-renders in real time as the sync script checkpoints its progress in
  // Firestore, whether it's running locally, in GitHub Actions, or via the admin trigger.
  useEffect(() => {
    let previousStatus: CharlotteFabricsSyncRun['status'] | null = null;
    const unsubscribe = subscribeToLatestSyncRun((run) => {
      setSyncRun(run);
      if (previousStatus === 'running' && run && run.status !== 'running' && catalogLoadedRef.current) {
        // A run just finished — refresh the catalog table so new data shows up without a manual
        // reload, but only if the table was already loaded; don't load it just because a sync ran.
        loadFabrics();
      }
      previousStatus = run?.status ?? null;
    });
    return unsubscribe;
  }, []);

  // A stalled run's Firestore doc stops changing, so onSnapshot won't re-fire on its own —
  // tick every 30s while a run is "running" so the stall check below re-evaluates over time.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    if (syncRun?.status !== 'running') return;
    const interval = setInterval(() => setClockTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [syncRun?.status]);

  const isStalled = useMemo(() => {
    if (!syncRun || syncRun.status !== 'running') return false;
    return Date.now() - syncRun.lastUpdatedAt.getTime() > STALL_THRESHOLD_MS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRun, clockTick]);

  const applicationOptions = useMemo(
    () => Array.from(new Set(fabrics.flatMap((f) => f.applications))).sort(),
    [fabrics]
  );
  const marketOptions = useMemo(
    () => Array.from(new Set(fabrics.flatMap((f) => f.markets))).sort(),
    [fabrics]
  );

  const priceTagById = useMemo(() => new Map(priceTags.map((t) => [t.id, t])), [priceTags]);
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  const filteredByFields = useMemo(
    () =>
      filterFabrics(fabrics, {
        search,
        color,
        pattern,
        material,
        application,
        market,
        priceTagId: priceTagFilter,
        groupId: groupFilter,
      }),
    [fabrics, search, color, pattern, material, application, market, priceTagFilter, groupFilter]
  );

  // Price range is a derived value (needs the resolved tags/ranges), so it's applied as a
  // second pass after filterFabrics() rather than folded into that shared, pure function.
  const filtered = useMemo(() => {
    if (!priceRangeFilter) return filteredByFields;
    return filteredByFields.filter((fabric) => {
      const price = resolveEffectivePrice(fabric, priceTagById).pricePerYard;
      return resolvePriceRange(price, priceRanges)?.id === priceRangeFilter;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredByFields, priceRangeFilter, priceRanges, priceTagById]);

  const brokenImageCount = useMemo(() => fabrics.filter((f) => !f.imageOk).length, [fabrics]);
  const unpricedCount = useMemo(
    () => fabrics.filter((f) => resolveEffectivePrice(f, priceTagById).pricePerYard == null).length,
    [fabrics, priceTagById]
  );

  const allVisibleSelected = filtered.length > 0 && filtered.every((f) => selectedIds.has(f.id));
  const someVisibleSelected = filtered.some((f) => selectedIds.has(f.id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((f) => next.delete(f.id));
      } else {
        filtered.forEach((f) => next.add(f.id));
      }
      return next;
    });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApplyPriceTag = async () => {
    if (!assignTagValue) return;
    setBulkSaving(true);
    try {
      const ids = Array.from(selectedIds);
      await bulkAssignPriceTag(ids, assignTagValue);
      // Patch local state instead of re-fetching the whole ~6,900-doc collection just to reflect
      // a write we already know the shape of — that reload pattern is what burns Firestore's daily
      // read quota fastest on this table.
      setFabrics((prev) => prev.map((f) => (selectedIds.has(f.id) ? { ...f, priceTagId: assignTagValue } : f)));
      setSelectedIds(new Set());
      setAssignTagDialogOpen(false);
      setAssignTagValue('');
    } catch (error) {
      console.error('Error bulk-assigning price tag:', error);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleApplyGroup = async () => {
    if (!addToGroupValue) return;
    setBulkSaving(true);
    try {
      await bulkAddToGroup(Array.from(selectedIds), addToGroupValue);
      setFabrics((prev) =>
        prev.map((f) =>
          selectedIds.has(f.id)
            ? { ...f, groupIds: Array.from(new Set([...(f.groupIds || []), addToGroupValue])) }
            : f
        )
      );
      setSelectedIds(new Set());
      setAddToGroupDialogOpen(false);
      setAddToGroupValue('');
    } catch (error) {
      console.error('Error bulk-adding to group:', error);
    } finally {
      setBulkSaving(false);
    }
  };

  const openEditPriceDialog = (fabric: CharlotteFabric) => {
    setEditPriceFabric(fabric);
    setEditPriceValue(fabric.manualRetailPrice != null ? String(fabric.manualRetailPrice) : '');
  };

  const closeEditPriceDialog = () => {
    setEditPriceFabric(null);
    setEditPriceValue('');
  };

  const handleSavePriceOverride = async () => {
    if (!editPriceFabric) return;
    const parsed = Number(editPriceValue);
    if (!editPriceValue || Number.isNaN(parsed)) return;
    setPriceSaving(true);
    try {
      await setFabricManualPrice(editPriceFabric.id, parsed);
      setFabrics((prev) => prev.map((f) => (f.id === editPriceFabric.id ? { ...f, manualRetailPrice: parsed } : f)));
      closeEditPriceDialog();
    } catch (error) {
      console.error('Error setting fabric price override:', error);
    } finally {
      setPriceSaving(false);
    }
  };

  const handleClearPriceOverride = async () => {
    if (!editPriceFabric) return;
    setPriceSaving(true);
    try {
      await setFabricManualPrice(editPriceFabric.id, null);
      setFabrics((prev) => prev.map((f) => (f.id === editPriceFabric.id ? { ...f, manualRetailPrice: null } : f)));
      closeEditPriceDialog();
    } catch (error) {
      console.error('Error clearing fabric price override:', error);
    } finally {
      setPriceSaving(false);
    }
  };

  const handleTriggerSync = async () => {
    setTriggering(true);
    setTriggerMessage(null);
    try {
      const res = await fetch('/api/admin/trigger-charlotte-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facetGroups: syncPhase }),
      });
      const data = await res.json();
      if (res.ok) {
        const phaseLabel = syncPhase === 'all' ? 'Full sync' : `${syncPhase[0].toUpperCase()}${syncPhase.slice(1)}-only sync`;
        setTriggerMessage(`${phaseLabel} started — progress will appear live below once it begins.`);
      } else {
        setTriggerMessage(data.error || 'Failed to trigger sync.');
      }
    } catch (error) {
      console.error('Error triggering Charlotte Fabrics sync:', error);
      setTriggerMessage('Failed to trigger sync.');
    } finally {
      setTriggering(false);
    }
  };

  const handlePublishPricing = async () => {
    setPublishing(true);
    setPublishMessage(null);
    try {
      const res = await fetch('/api/admin/publish-fabric-pricing', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setPublishMessage(
          `Published ${data.published} priced item(s) to the live site` +
            (data.unpriced > 0 ? ` (${data.unpriced} unpriced item(s) excluded).` : '.')
        );
      } else {
        setPublishMessage(data.error || 'Failed to publish pricing.');
      }
    } catch (error) {
      console.error('Error publishing fabric pricing:', error);
      setPublishMessage('Failed to publish pricing.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Charlotte Fabrics Catalog
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={publishing ? <CircularProgress size={16} /> : <PublishIcon />}
            disabled={publishing}
            onClick={handlePublishPricing}
          >
            Publish Pricing
          </Button>
          <TextField
            select
            size="small"
            label="Phase"
            value={syncPhase}
            onChange={(e) => setSyncPhase(e.target.value as typeof syncPhase)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All (full sync)</MenuItem>
            <MenuItem value="color">Color only</MenuItem>
            <MenuItem value="pattern">Pattern only</MenuItem>
            <MenuItem value="material">Material only</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={triggering ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            disabled={triggering}
            onClick={handleTriggerSync}
            sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#222' } }}
          >
            Run Sync Now
          </Button>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        &quot;Publish Pricing&quot; pushes your current price tag assignments live in seconds, without
        re-crawling charlottefabrics.com — use it after tagging fabrics. &quot;Run Sync Now&quot;
        re-crawls their site for new/changed products and takes much longer.
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        A phase (color/pattern/material) covers only that facet and takes far less time than a full sync — tags from other phases are kept, not overwritten. Only a full sync can mark products as no longer available.
      </Typography>

      {publishMessage && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setPublishMessage(null)}>
          {publishMessage}
        </Alert>
      )}

      {triggerMessage && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setTriggerMessage(null)}>
          {triggerMessage}
        </Alert>
      )}

      {isStalled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This run hasn&apos;t reported progress in over 3 minutes — it likely crashed or was
          interrupted rather than genuinely still working. It&apos;s safe to click &quot;Run Sync
          Now&quot; again; the stalled run will just be superseded.
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Last Sync Run
        </Typography>
        {syncRun ? (
          <Box>
            {syncRun.status === 'running' && (
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {PHASE_LABELS[syncRun.phase]}
                  </Typography>
                  {syncRun.phase === 'fetching-products' && syncRun.discovered > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {syncRun.totals.scanned} / {syncRun.discovered}
                    </Typography>
                  )}
                </Stack>
                {syncRun.phase === 'fetching-products' && syncRun.discovered > 0 ? (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (syncRun.totals.scanned / syncRun.discovered) * 100)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                ) : (
                  <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
                )}
              </Box>
            )}
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              <Typography variant="body2">
                <strong>Status:</strong> {syncRun.status}
              </Typography>
              <Typography variant="body2">
                <strong>Started:</strong> {formatDate(syncRun.startedAt)}
              </Typography>
              <Typography variant="body2">
                <strong>Finished:</strong> {formatDate(syncRun.finishedAt)}
              </Typography>
              <Typography variant="body2">
                <strong>Discovered:</strong> {syncRun.discovered || '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Scanned:</strong> {syncRun.totals.scanned}
              </Typography>
              <Typography variant="body2">
                <strong>Added:</strong> {syncRun.totals.added}
              </Typography>
              <Typography variant="body2">
                <strong>Updated:</strong> {syncRun.totals.updated}
              </Typography>
              <Typography variant="body2">
                <strong>Deactivated:</strong> {syncRun.totals.deactivated}
              </Typography>
              <Typography variant="body2">
                <strong>Broken Images:</strong> {syncRun.totals.brokenImages}
              </Typography>
              <Typography variant="body2">
                <strong>Errors:</strong> {syncRun.totals.errors}
              </Typography>
              <Typography variant="body2" sx={syncRun.totals.structuralWarnings > 0 ? { color: 'error.main', fontWeight: 'bold' } : undefined}>
                <strong>Structural Warnings:</strong> {syncRun.totals.structuralWarnings}
                {syncRun.totals.structuralWarnings > 0 && ' — Charlotte Fabrics’ site layout may have changed'}
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No sync has run yet. Run <code>node scripts/sync-charlotte-fabrics.js</code> or click &quot;Run Sync Now&quot; above.
          </Typography>
        )}
      </Paper>

      {!catalogLoaded ? (
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The catalog table isn&apos;t loaded yet. Browsing and filtering the ~6,900-item catalog
            costs a full Firestore read every time, so it&apos;s loaded on demand — &quot;Publish
            Pricing&quot; and &quot;Run Sync Now&quot; above work without loading it.
          </Typography>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            disabled={loading}
            onClick={loadFabrics}
            sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#222' } }}
          >
            {loading ? 'Loading…' : 'Load Catalog'}
          </Button>
        </Paper>
      ) : (
        <>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
        {loading ? (
          <CircularProgress size={16} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {fabrics.length} active fabrics{brokenImageCount > 0 && `, ${brokenImageCount} with broken images`}
            {unpricedCount > 0 && (
              <Box component="span" sx={{ color: 'warning.dark', fontWeight: 'bold' }}>
                {`, ${unpricedCount} unpriced (not shown to customers)`}
              </Box>
            )}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          label="Search name/SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField select size="small" label="Color" value={color} onChange={(e) => setColor(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Any Color</MenuItem>
          {CHARLOTTE_FABRIC_COLORS.map((c) => (
            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Any Pattern</MenuItem>
          {CHARLOTTE_FABRIC_PATTERNS.map((p) => (
            <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Material" value={material} onChange={(e) => setMaterial(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Any Material</MenuItem>
          {CHARLOTTE_FABRIC_MATERIALS.map((m) => (
            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Application" value={application} onChange={(e) => setApplication(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Any Application</MenuItem>
          {applicationOptions.map((a) => (
            <MenuItem key={a} value={a}>{a}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Market" value={market} onChange={(e) => setMarket(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Any Market</MenuItem>
          {marketOptions.map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
        <TextField
          select
          size="small"
          label="Price Tag"
          value={priceTagFilter}
          onChange={(e) => setPriceTagFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Any Price Tag</MenuItem>
          <MenuItem value={UNTAGGED_PRICE_TAG_FILTER}>Unpriced (no tag)</MenuItem>
          {priceTags.map((t) => (
            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Group"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Any Group</MenuItem>
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Price Range"
          value={priceRangeFilter}
          onChange={(e) => setPriceRangeFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Any Price Range</MenuItem>
          {priceRanges.map((r) => (
            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {selectedIds.size > 0 && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 2, bgcolor: 'primary.50' }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {selectedIds.size} selected
            </Typography>
            <Button size="small" variant="outlined" onClick={() => setAssignTagDialogOpen(true)}>
              Assign Price Tag
            </Button>
            <Button size="small" variant="outlined" onClick={() => setAddToGroupDialogOpen(true)}>
              Add to Group
            </Button>
            <Button size="small" onClick={() => setSelectedIds(new Set())}>
              Clear selection
            </Button>
          </Stack>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Pattern</TableCell>
              <TableCell>Material</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Price Source</TableCell>
              <TableCell>Effective Price</TableCell>
              <TableCell>Price Range</TableCell>
              <TableCell>Groups</TableCell>
              <TableCell>Image</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((fabric) => {
              const { pricePerYard: effectivePrice, source: priceSource } = resolveEffectivePrice(fabric, priceTagById);
              const priceRange = resolvePriceRange(effectivePrice, priceRanges);
              const fabricGroups = (fabric.groupIds || []).map((id) => groupById.get(id)).filter(Boolean) as FabricGroup[];
              return (
                <TableRow key={fabric.id} hover selected={selectedIds.has(fabric.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.has(fabric.id)} onChange={() => toggleSelectRow(fabric.id)} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{fabric.name}</TableCell>
                  <TableCell>{fabric.sku}</TableCell>
                  <TableCell>{fabric.color.join(', ') || '—'}</TableCell>
                  <TableCell>{fabric.pattern.join(', ') || '—'}</TableCell>
                  <TableCell>{fabric.material.join(', ') || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={fabric.availability}
                      color={fabric.availability === 'InStock' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {priceSource === 'override' && <Chip size="small" color="info" label="Manual" />}
                    {priceSource === 'retail' && <Chip size="small" color="success" label="Master List" />}
                    {priceSource === 'tag' && (
                      <Chip size="small" label={fabric.priceTagId ? priceTagById.get(fabric.priceTagId)?.name || 'Unknown' : 'Unknown'} />
                    )}
                    {priceSource === null && <Chip size="small" color="warning" label="Unpriced" />}
                  </TableCell>
                  <TableCell>{effectivePrice != null ? `$${effectivePrice.toFixed(2)}` : '—'}</TableCell>
                  <TableCell>
                    {priceRange ? <Chip size="small" label={priceRange.name} /> : '—'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {fabricGroups.length === 0 ? '—' : fabricGroups.map((g) => (
                        <Chip key={g.id} size="small" label={g.name} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {fabric.imageOk ? (
                      <Chip size="small" label="OK" color="success" />
                    ) : (
                      <Chip size="small" icon={<ErrorOutlineIcon />} label="Broken" color="error" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        component="button"
                        onClick={() => openEditPriceDialog(fabric)}
                        sx={{ color: 'text.secondary', border: 'none', bgcolor: 'transparent', cursor: 'pointer', display: 'flex', p: 0 }}
                        aria-label="Edit price"
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </Box>
                      {fabric.productUrl && (
                        <Box component="a" href={fabric.productUrl} target="_blank" rel="noopener noreferrer" sx={{ color: 'text.secondary', display: 'flex' }}>
                          <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </Box>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={13}>
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No fabrics match these filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}
        </>
      )}

      <Dialog open={assignTagDialogOpen} onClose={() => setAssignTagDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Price Tag</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apply to {selectedIds.size} selected item{selectedIds.size === 1 ? '' : 's'}.
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Price Tag"
            value={assignTagValue}
            onChange={(e) => setAssignTagValue(e.target.value)}
          >
            {priceTags.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name} (${t.pricePerYard.toFixed(2)}/yd)</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignTagDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!assignTagValue || bulkSaving} onClick={handleApplyPriceTag}>
            {bulkSaving ? 'Applying...' : `Apply to ${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addToGroupDialogOpen} onClose={() => setAddToGroupDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add to Group</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apply to {selectedIds.size} selected item{selectedIds.size === 1 ? '' : 's'}.
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Group"
            value={addToGroupValue}
            onChange={(e) => setAddToGroupValue(e.target.value)}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddToGroupDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!addToGroupValue || bulkSaving} onClick={handleApplyGroup}>
            {bulkSaving ? 'Applying...' : `Apply to ${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editPriceFabric} onClose={closeEditPriceDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Price — {editPriceFabric?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editPriceFabric?.retailPrice != null
              ? `Master price list retail: $${editPriceFabric.retailPrice.toFixed(2)}/yd. Setting a price here overrides it and won't be touched by future spreadsheet imports.`
              : "No master price list retail is on file for this item — set a price here to make it purchasable."}
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Manual price ($/yd)"
            value={editPriceValue}
            onChange={(e) => setEditPriceValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          {editPriceFabric?.manualRetailPrice != null && (
            <Button color="warning" disabled={priceSaving} onClick={handleClearPriceOverride} sx={{ mr: 'auto' }}>
              Clear override
            </Button>
          )}
          <Button onClick={closeEditPriceDialog}>Cancel</Button>
          <Button variant="contained" disabled={!editPriceValue || priceSaving} onClick={handleSavePriceOverride}>
            {priceSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
