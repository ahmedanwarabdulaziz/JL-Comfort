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
  TablePagination,
  Paper,
  Typography,
  Chip,
  Stack,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
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
import { CharlotteFabric } from '@/lib/types/charlotteFabric';
import {
  getUnpricedCharlotteFabrics,
  setFabricManualPrice,
  bulkSetFabricManualPrice,
  bulkAssignPriceTag,
} from '@/lib/data/charlotteFabricCatalog';
import { CHARLOTTE_FABRIC_MATERIALS } from '@/lib/data/charlotteFabricFacets';
import { FabricPriceTag } from '@/lib/types/fabricPriceTag';
import { getFabricPriceTags } from '@/lib/data/fabricPriceTags';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const parsePrice = (value: string | undefined): number | null => {
  if (!value || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function UnpricedFabricsList() {
  const [fabrics, setFabrics] = useState<CharlotteFabric[]>([]);
  const [priceTags, setPriceTags] = useState<FabricPriceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [material, setMaterial] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Price typed into each row's input, keyed by fabric id, and which rows are mid-save / failed.
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Fabrics priced on this page since the last publish. They're saved in the database right away,
  // but customers only see them after "Publish to live site" rewrites the public snapshot.
  const [unpublishedCount, setUnpublishedCount] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ severity: 'success' | 'error' | 'info'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [unpriced, tags] = await Promise.all([getUnpricedCharlotteFabrics(), getFabricPriceTags()]);
      setFabrics(unpriced);
      setPriceTags(tags);
    } catch (error) {
      console.error('Error loading unpriced fabrics:', error);
      setLoadError('Failed to load unpriced fabrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fabrics
      .filter((f) => !material || f.material.includes(material))
      .filter((f) => !q || `${f.name} ${f.sku}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name) || a.sku.localeCompare(b.sku));
  }, [fabrics, search, material]);

  // Reset to the first page whenever the visible set changes so the page never points past the end.
  useEffect(() => {
    setPage(0);
  }, [search, material, rowsPerPage]);

  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const allPageSelected = pageRows.length > 0 && pageRows.every((f) => selectedIds.has(f.id));
  const somePageSelected = pageRows.some((f) => selectedIds.has(f.id));

  const togglePage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageRows.forEach((f) => (allPageSelected ? next.delete(f.id) : next.add(f.id)));
      return next;
    });
  };

  const selectAllFiltered = () => setSelectedIds(new Set(filtered.map((f) => f.id)));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Once priced, a fabric leaves this list (it's no longer "unpriced").
  const removeFromList = (ids: string[]) => {
    const gone = new Set(ids);
    setFabrics((prev) => prev.filter((f) => !gone.has(f.id)));
    setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => !gone.has(id))));
    setPriceInputs((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });
    setUnpublishedCount((c) => c + ids.length);
  };

  const saveRow = async (fabric: CharlotteFabric) => {
    const price = parsePrice(priceInputs[fabric.id]);
    if (price == null) {
      setRowErrors((prev) => ({ ...prev, [fabric.id]: 'Enter a price above 0' }));
      return;
    }
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[fabric.id];
      return next;
    });
    setSavingIds((prev) => new Set(prev).add(fabric.id));
    try {
      await setFabricManualPrice(fabric.id, price);
      removeFromList([fabric.id]);
    } catch {
      setRowErrors((prev) => ({ ...prev, [fabric.id]: 'Save failed — try again' }));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(fabric.id);
        return next;
      });
    }
  };

  const handleBulkPrice = async () => {
    const price = parsePrice(bulkPriceValue);
    if (price == null) return;
    setBulkSaving(true);
    try {
      const ids = Array.from(selectedIds);
      await bulkSetFabricManualPrice(ids, price);
      removeFromList(ids);
      setBulkPriceOpen(false);
      setBulkPriceValue('');
      setMessage({ severity: 'success', text: `Priced ${ids.length} fabric${ids.length === 1 ? '' : 's'} at $${price.toFixed(2)}/yd.` });
    } catch {
      setMessage({ severity: 'error', text: 'Bulk price failed part-way — reload the list to see what was saved.' });
    } finally {
      setBulkSaving(false);
    }
  };

  const handleBulkTag = async () => {
    if (!bulkTagValue) return;
    setBulkSaving(true);
    try {
      const ids = Array.from(selectedIds);
      await bulkAssignPriceTag(ids, bulkTagValue);
      removeFromList(ids);
      setBulkTagOpen(false);
      setBulkTagValue('');
      const tagName = priceTags.find((t) => t.id === bulkTagValue)?.name;
      setMessage({ severity: 'success', text: `Assigned price tag${tagName ? ` "${tagName}"` : ''} to ${ids.length} fabric${ids.length === 1 ? '' : 's'}.` });
    } catch {
      setMessage({ severity: 'error', text: 'Bulk price tag failed part-way — reload the list to see what was saved.' });
    } finally {
      setBulkSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/publish-fabric-pricing', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setUnpublishedCount(0);
        setMessage({
          severity: 'success',
          text: `Published ${data.published.toLocaleString()} priced fabrics to the live site` +
            (data.unpriced > 0 ? ` (${data.unpriced.toLocaleString()} still unpriced and hidden).` : '.') +
            ' The storefront can take up to 30 minutes to reflect it because of caching.',
        });
      } else {
        setMessage({ severity: 'error', text: data.error || 'Failed to publish.' });
      }
    } catch {
      setMessage({ severity: 'error', text: 'Failed to publish.' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Unpriced Fabrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? 'Loading…'
              : `${fabrics.length.toLocaleString()} fabric${fabrics.length === 1 ? '' : 's'} with no price — hidden from customers until priced.`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading} onClick={load}>
            Reload
          </Button>
          <Button
            variant="contained"
            startIcon={publishing ? <CircularProgress size={16} color="inherit" /> : <PublishIcon />}
            disabled={publishing}
            onClick={handlePublish}
            sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#222' } }}
          >
            Publish to live site{unpublishedCount > 0 ? ` (${unpublishedCount} new)` : ''}
          </Button>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Prices you save are stored straight away as a manual price ($/yd). A priced fabric leaves this list, but
        only appears on the live site after you click &quot;Publish to live site&quot;.
      </Typography>

      {unpublishedCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {unpublishedCount} fabric{unpublishedCount === 1 ? ' is' : 's are'} priced but not on the live site yet —
          click &quot;Publish to live site&quot; when you&apos;re done.
        </Alert>
      )}
      {message && (
        <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          label="Search name/SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField select size="small" label="Material" value={material} onChange={(e) => setMaterial(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">Any Material</MenuItem>
          {CHARLOTTE_FABRIC_MATERIALS.map((m) => (
            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {selectedIds.size > 0 && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {selectedIds.size} selected
            </Typography>
            <Button size="small" variant="outlined" onClick={() => setBulkPriceOpen(true)}>
              Set Price
            </Button>
            <Button size="small" variant="outlined" onClick={() => setBulkTagOpen(true)}>
              Assign Price Tag
            </Button>
            {selectedIds.size < filtered.length && (
              <Button size="small" onClick={selectAllFiltered}>
                Select all {filtered.length.toLocaleString()} matching
              </Button>
            )}
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
                  <Checkbox checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected} onChange={togglePage} />
                </TableCell>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Pattern</TableCell>
                <TableCell>Availability</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Price ($/yd)</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((fabric) => {
                const saving = savingIds.has(fabric.id);
                return (
                  <TableRow key={fabric.id} hover selected={selectedIds.has(fabric.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedIds.has(fabric.id)} onChange={() => toggleRow(fabric.id)} />
                    </TableCell>
                    <TableCell sx={{ width: 56 }}>
                      {fabric.imageUrl && (
                        <Box
                          component="img"
                          src={fabric.imageUrl}
                          alt=""
                          loading="lazy"
                          sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 0.5, display: 'block', bgcolor: 'action.hover' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{fabric.name}</TableCell>
                    <TableCell>{fabric.sku}</TableCell>
                    <TableCell>{fabric.material.join(', ') || '—'}</TableCell>
                    <TableCell>{fabric.pattern.join(', ') || '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={fabric.availability} color={fabric.availability === 'InStock' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="0.00"
                        value={priceInputs[fabric.id] ?? ''}
                        disabled={saving}
                        error={!!rowErrors[fabric.id]}
                        helperText={rowErrors[fabric.id]}
                        onChange={(e) => setPriceInputs((prev) => ({ ...prev, [fabric.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRow(fabric);
                        }}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        inputProps={{ min: 0, step: '0.01' }}
                        sx={{ width: 150 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          variant="contained"
                          disabled={saving || parsePrice(priceInputs[fabric.id]) == null}
                          onClick={() => saveRow(fabric)}
                          sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#222' } }}
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </Button>
                        {fabric.productUrl && (
                          <Box
                            component="a"
                            href={fabric.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Charlotte Fabrics"
                            sx={{ color: 'text.secondary', display: 'flex' }}
                          >
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
                  <TableCell colSpan={9}>
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      {fabrics.length === 0 ? 'Every active fabric has a price.' : 'No unpriced fabrics match these filters.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          />
        </TableContainer>
      )}

      <Dialog open={bulkPriceOpen} onClose={() => setBulkPriceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Price</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set the same manual price on {selectedIds.size} selected fabric{selectedIds.size === 1 ? '' : 's'}.
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Price ($/yd)"
            value={bulkPriceValue}
            onChange={(e) => setBulkPriceValue(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            inputProps={{ min: 0, step: '0.01' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkPriceOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={parsePrice(bulkPriceValue) == null || bulkSaving} onClick={handleBulkPrice}>
            {bulkSaving ? 'Applying…' : `Apply to ${selectedIds.size}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkTagOpen} onClose={() => setBulkTagOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Price Tag</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apply to {selectedIds.size} selected fabric{selectedIds.size === 1 ? '' : 's'}.
          </Typography>
          <TextField select fullWidth size="small" label="Price Tag" value={bulkTagValue} onChange={(e) => setBulkTagValue(e.target.value)}>
            {priceTags.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name} (${t.pricePerYard.toFixed(2)}/yd)</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkTagOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!bulkTagValue || bulkSaving} onClick={handleBulkTag}>
            {bulkSaving ? 'Applying…' : `Apply to ${selectedIds.size}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
