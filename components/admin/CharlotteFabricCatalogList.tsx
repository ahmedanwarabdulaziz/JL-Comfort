'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { CharlotteFabric, CharlotteFabricsSyncRun } from '@/lib/types/charlotteFabric';
import { getCharlotteFabrics, subscribeToLatestSyncRun, filterFabrics } from '@/lib/data/charlotteFabricCatalog';
import { auth } from '@/lib/firebase/config';
import {
  CHARLOTTE_FABRIC_COLORS,
  CHARLOTTE_FABRIC_PATTERNS,
  CHARLOTTE_FABRIC_MATERIALS,
} from '@/lib/data/charlotteFabricFacets';

const formatDate = (date: Date | null) => (date ? date.toLocaleString() : '—');

const PHASE_LABELS: Record<CharlotteFabricsSyncRun['phase'], string> = {
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
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [syncPhase, setSyncPhase] = useState<'all' | 'color' | 'pattern' | 'material'>('all');

  const [search, setSearch] = useState('');
  const [color, setColor] = useState('');
  const [pattern, setPattern] = useState('');
  const [material, setMaterial] = useState('');
  const [application, setApplication] = useState('');
  const [market, setMarket] = useState('');

  const loadFabrics = async () => {
    setLoading(true);
    try {
      const fabricResults = await getCharlotteFabrics();
      setFabrics(fabricResults);
    } catch (error) {
      console.error('Error loading Charlotte Fabrics catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFabrics();
  }, []);

  // Live progress: re-renders in real time as the sync script checkpoints its progress in
  // Firestore, whether it's running locally, in GitHub Actions, or via the admin trigger.
  useEffect(() => {
    let previousStatus: CharlotteFabricsSyncRun['status'] | null = null;
    const unsubscribe = subscribeToLatestSyncRun((run) => {
      setSyncRun(run);
      if (previousStatus === 'running' && run && run.status !== 'running') {
        // A run just finished — refresh the catalog table so new data shows up without a manual reload.
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

  const filtered = useMemo(
    () => filterFabrics(fabrics, { search, color, pattern, material, application, market }),
    [fabrics, search, color, pattern, material, application, market]
  );

  const brokenImageCount = useMemo(() => fabrics.filter((f) => !f.imageOk).length, [fabrics]);

  const handleTriggerSync = async () => {
    setTriggering(true);
    setTriggerMessage(null);
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) {
        setTriggerMessage('You must be signed in to trigger a sync.');
        return;
      }
      const res = await fetch('/api/admin/trigger-charlotte-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
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

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Charlotte Fabrics Catalog
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
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

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        A phase (color/pattern/material) covers only that facet and takes far less time than a full sync — tags from other phases are kept, not overwritten. Only a full sync can mark products as no longer available.
      </Typography>

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

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
        {loading ? (
          <CircularProgress size={16} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {fabrics.length} active fabrics{brokenImageCount > 0 && `, ${brokenImageCount} with broken images`}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Pattern</TableCell>
              <TableCell>Material</TableCell>
              <TableCell>Fiber Content</TableCell>
              <TableCell>Durability</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Image</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((fabric) => (
              <TableRow key={fabric.id} hover>
                <TableCell sx={{ fontWeight: 'bold' }}>{fabric.name}</TableCell>
                <TableCell>{fabric.sku}</TableCell>
                <TableCell>{fabric.color.join(', ') || '—'}</TableCell>
                <TableCell>{fabric.pattern.join(', ') || '—'}</TableCell>
                <TableCell>{fabric.material.join(', ') || '—'}</TableCell>
                <TableCell>{fabric.fiberContent || '—'}</TableCell>
                <TableCell>{fabric.durability || '—'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={fabric.availability}
                    color={fabric.availability === 'InStock' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {fabric.imageOk ? (
                    <Chip size="small" label="OK" color="success" />
                  ) : (
                    <Chip size="small" icon={<ErrorOutlineIcon />} label="Broken" color="error" />
                  )}
                </TableCell>
                <TableCell>
                  {fabric.productUrl && (
                    <Box component="a" href={fabric.productUrl} target="_blank" rel="noopener noreferrer" sx={{ color: 'text.secondary' }}>
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
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
    </Box>
  );
}
