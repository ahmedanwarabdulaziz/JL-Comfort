'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getCheckoutOrderRows, getSubscriberStatuses } from '@/lib/data/orders';
import { CheckoutSession, SessionOutcome, buildCheckoutSessions, summarizeCheckoutSessions } from '@/lib/analytics/abandonedCheckouts';

const money = (cents: number) => `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;
const when = (d: Date) => d.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
const DAY_MS = 24 * 60 * 60 * 1000;

const OUTCOMES: Record<SessionOutcome, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  abandoned: { label: 'Abandoned', color: 'error' },
  recovered: { label: 'Recovered', color: 'success' },
  completed: { label: 'Paid first try', color: 'default' },
  in_progress: { label: 'In progress', color: 'info' },
};

const SHOW: Record<string, { label: string; outcomes: SessionOutcome[] }> = {
  abandoned: { label: 'Abandoned', outcomes: ['abandoned', 'in_progress'] },
  recovered: { label: 'Recovered', outcomes: ['recovered'] },
  all: { label: 'All checkouts', outcomes: ['abandoned', 'in_progress', 'recovered', 'completed'] },
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 160px', minWidth: 150 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

function EmailPermission({ session, status }: { session: CheckoutSession; status?: string }) {
  if (status === 'unsubscribed') return <Chip size="small" variant="outlined" label="Unsubscribed" />;
  if (session.optedIn || status === 'subscribed') return <Chip size="small" color="success" variant="outlined" label="Can email" />;
  return (
    <Tooltip title="Didn't tick the reminders & offers box, so under CASL only order-related emails can be sent.">
      <Chip size="small" variant="outlined" label="No consent" />
    </Tooltip>
  );
}

export default function AbandonedCheckouts() {
  const [days, setDays] = useState(30);
  const [show, setShow] = useState('abandoned');
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [subscribers, setSubscribers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const since = new Date(Date.now() - days * DAY_MS);
      // Load a week further back, so a checkout that started just before the period and was paid
      // inside it is still seen as one session.
      const rows = await getCheckoutOrderRows(new Date(since.getTime() - 7 * DAY_MS));
      const all = buildCheckoutSessions(rows).filter((s) => s.lastAt >= since);
      setSessions(all);
      setSubscribers(await getSubscriberStatuses(Array.from(new Set(all.map((s) => s.email)))));
    } catch (loadError: any) {
      setError(loadError?.message || 'Could not load checkouts.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => summarizeCheckoutSessions(sessions), [sessions]);
  const visible = sessions.filter((s) => SHOW[show].outcomes.includes(s.outcome));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Abandoned checkouts</Typography>
        <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, value) => value && setDays(value)}>
          <ToggleButton value={7}>7 days</ToggleButton>
          <ToggleButton value={30}>30 days</ToggleButton>
          <ToggleButton value={90}>90 days</ToggleButton>
          <ToggleButton value={365}>12 months</ToggleButton>
        </ToggleButtonGroup>
        <IconButton onClick={load} aria-label="Refresh"><RefreshIcon /></IconButton>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 820 }}>
        Shoppers who entered their details and went to payment but didn&rsquo;t pay. Repeated tries by the same email
        count as one checkout, and it&rsquo;s <strong>recovered</strong> if they paid afterwards. Test orders aren&rsquo;t included.
        For shoppers who never reached the delivery form, see the funnel in Google Analytics.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Stat label="Checkouts started" value={String(summary.sessions)} hint={`${summary.completed + summary.recovered} paid`} />
            <Stat label="Abandonment rate" value={summary.sessions ? percent(summary.abandonmentRate) : '—'} hint={`${summary.abandoned} abandoned`} />
            <Stat label="Abandoned value" value={money(summary.abandonedValueCents)} hint="left unpaid" />
            <Stat label="Recovered" value={money(summary.recoveredValueCents)} hint={summary.recovered + summary.abandoned ? `${percent(summary.recoveryRate)} came back and paid` : 'none yet'} />
            <Stat label="Can be emailed" value={`${summary.abandonedOptedIn} of ${summary.abandoned}`} hint="abandoned, opted in to reminders" />
          </Box>

          {summary.topAbandonedItems.length > 0 && (
            <Paper variant="outlined" sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ px: 2, pt: 1.5 }}>Most often left in abandoned carts</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Abandoned carts</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.topAbandonedItems.map((item) => (
                      <TableRow key={item.sku || item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.sku || '—'}</TableCell>
                        <TableCell align="right">{item.carts}</TableCell>
                        <TableCell align="right">{money(item.valueCents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          <ToggleButtonGroup size="small" exclusive value={show} onChange={(_, value) => value && setShow(value)} sx={{ mb: 1.5 }}>
            {Object.entries(SHOW).map(([key, option]) => <ToggleButton key={key} value={key}>{option.label}</ToggleButton>)}
          </ToggleButtonGroup>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Last attempt</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Cart</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Outcome</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nothing here for this period.</TableCell></TableRow>
                )}
                {visible.map((session) => (
                  <TableRow
                    key={`${session.email}-${session.lastOrderId}`}
                    hover
                    sx={{ cursor: 'pointer', verticalAlign: 'top' }}
                    onClick={() => window.open(`/admin/orders?order=${session.lastOrderId}`, '_blank')}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {when(session.lastAt)}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {session.lastOrderNumber}{session.attempts > 1 ? ` · ${session.attempts} tries` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {session.name}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{session.email}</Typography>
                      {session.phone && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{session.phone}</Typography>}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{session.city}, {session.region}</Typography>
                    </TableCell>
                    <TableCell>
                      {session.items.map((item, index) => (
                        <Typography key={index} variant="body2">{item.quantity} × {item.name}</Typography>
                      ))}
                    </TableCell>
                    <TableCell align="right">{money(session.valueCents)}</TableCell>
                    <TableCell>
                      <Chip size="small" color={OUTCOMES[session.outcome].color} label={OUTCOMES[session.outcome].label} />
                      {session.paidOrderNumber && session.outcome === 'recovered' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Paid as {session.paidOrderNumber}</Typography>
                      )}
                    </TableCell>
                    <TableCell><EmailPermission session={session} status={subscribers.get(session.email)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
