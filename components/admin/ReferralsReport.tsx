'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ReferralRow, getReferralReport } from '@/lib/data/referrals';

// Admin -> Referrals: arrivals, unique visitors, sample requests, orders and revenue for every tagged
// link, by source, campaign (for jlupholstery.com: the placement) and content (the page it was on).

const PERIODS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '12 months' },
];
const ALL = '__all__';
const PREFERRED_SOURCE = 'jlupholstery';

const money = (cents: number) => `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const rate = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '—');

type Totals = Omit<ReferralRow, 'source' | 'campaign' | 'content'>;
const sum = (rows: ReferralRow[]): Totals =>
  rows.reduce(
    (t, r) => ({
      arrivals: t.arrivals + r.arrivals,
      uniqueVisitors: t.uniqueVisitors + r.uniqueVisitors,
      sampleRequests: t.sampleRequests + r.sampleRequests,
      orders: t.orders + r.orders,
      revenueCents: t.revenueCents + r.revenueCents,
    }),
    { arrivals: 0, uniqueVisitors: 0, sampleRequests: 0, orders: 0, revenueCents: 0 }
  );

function NumbersCells({ t }: { t: Totals }) {
  return (
    <>
      <TableCell align="right">{t.arrivals}</TableCell>
      <TableCell align="right">{t.uniqueVisitors}</TableCell>
      <TableCell align="right">{t.sampleRequests}</TableCell>
      <TableCell align="right">{t.orders}</TableCell>
      <TableCell align="right">{rate(t.orders, t.uniqueVisitors)}</TableCell>
      <TableCell align="right">{money(t.revenueCents)}</TableCell>
    </>
  );
}

const NUMBER_HEADS = ['Arrivals', 'Unique visitors', 'Sample requests', 'Orders', 'Order rate', 'Revenue'];

export default function ReferralsReport() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<ReferralRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null); // null until the first load picks a default

  const load = useCallback(async () => {
    setError(null);
    setRows(null);
    try {
      setRows(await getReferralReport(new Date(Date.now() - days * 86_400_000)));
    } catch (err: any) {
      setError(
        /referral_visits|attribution/.test(err?.message || '')
          ? 'The referrals table is missing. Run supabase/migrations/20261030120000_referral_visits.sql in the Supabase SQL Editor.'
          : err?.message || 'Could not load the report.'
      );
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const sources = useMemo(() => [...new Set((rows || []).map((r) => r.source))].sort(), [rows]);
  useEffect(() => {
    if (rows && source === null) setSource(sources.includes(PREFERRED_SOURCE) ? PREFERRED_SOURCE : ALL);
  }, [rows, sources, source]);

  const shown = useMemo(() => (rows || []).filter((r) => !source || source === ALL || r.source === source), [rows, source]);
  const totals = useMemo(() => sum(shown), [shown]);
  const byCampaign = useMemo(() => {
    const groups = new Map<string, ReferralRow[]>();
    for (const r of shown) {
      const key = `${r.source}\u0000${r.campaign}`;
      groups.set(key, [...(groups.get(key) || []), r]);
    }
    return [...groups.values()]
      .map((group) => ({ source: group[0].source, campaign: group[0].campaign, ...sum(group) }))
      .sort((a, b) => b.revenueCents - a.revenueCents || b.arrivals - a.arrivals);
  }, [shown]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Referrals</Typography>
        <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, value) => value && setDays(value)}>
          {PERIODS.map((p) => <ToggleButton key={p.days} value={p.days}>{p.label}</ToggleButton>)}
        </ToggleButtonGroup>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="referral-source">Source</InputLabel>
          <Select labelId="referral-source" label="Source" value={source ?? ALL} onChange={(e) => setSource(e.target.value)}>
            <MenuItem value={ALL}>All sources</MenuItem>
            {sources.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Button size="small" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Visitors who arrived from a tagged link (utm_source), and what they did next. For jlupholstery.com,{' '}
        <strong>campaign</strong> is the promo they clicked and <strong>content</strong> is the jlupholstery.com page it was on.
        Arrivals are counted whatever the cookie choice; sample requests and orders are matched to the link that last brought the customer in.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!rows && !error && <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>}

      {rows && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
            {[
              ['Arrivals', String(totals.arrivals)],
              ['Unique visitors', String(totals.uniqueVisitors)],
              ['Sample requests', String(totals.sampleRequests)],
              ['Orders', `${totals.orders} (${rate(totals.orders, totals.uniqueVisitors)})`],
              ['Revenue', money(totals.revenueCents)],
            ].map(([label, value]) => (
              <Paper key={label} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="overline" color="text.secondary">{label}</Typography>
                <Typography variant="h5">{value}</Typography>
              </Paper>
            ))}
          </Box>

          {shown.length === 0 ? (
            <Alert severity="info">
              No tagged visits in this period yet. Links from jlupholstery.com look like{' '}
              <code>jlcomfort.com/fabrics?utm_source=jlupholstery&amp;utm_campaign=slide_in&amp;utm_content=home</code>.
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>By promo (campaign)</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Source</TableCell>
                      <TableCell>Campaign</TableCell>
                      {NUMBER_HEADS.map((h) => <TableCell key={h} align="right">{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {byCampaign.map((r) => (
                      <TableRow key={`${r.source}-${r.campaign}`}>
                        <TableCell>{r.source}</TableCell>
                        <TableCell>{r.campaign}</TableCell>
                        <NumbersCells t={r} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>By page (campaign + content)</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Source</TableCell>
                      <TableCell>Campaign</TableCell>
                      <TableCell>Content (page)</TableCell>
                      {NUMBER_HEADS.map((h) => <TableCell key={h} align="right">{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shown.map((r) => (
                      <TableRow key={`${r.source}-${r.campaign}-${r.content}`}>
                        <TableCell>{r.source}</TableCell>
                        <TableCell>{r.campaign}</TableCell>
                        <TableCell>{r.content}</TableCell>
                        <NumbersCells t={r} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
    </Box>
  );
}
