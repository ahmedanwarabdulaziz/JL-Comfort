'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Paper,
  Stack,
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
import TelegramIcon from '@mui/icons-material/Telegram';
import { supabase } from '@/lib/supabase/client';
import { getCheckoutOrderRows } from '@/lib/data/orders';
import { buildCheckoutSessions } from '@/lib/analytics/abandonedCheckouts';

// Admin → Dashboard: sales at a glance, the latest alerts (the same ones the Telegram bot sends,
// from app_events) and the bot's setup. Reads through the admin's session (RLS: admin_users only).

const PAID_STATUSES = ['paid', 'sent_to_supplier', 'shipped', 'delivered', 'closed', 'problem'];
const REFRESH_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const money = (cents: number) => `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });

interface PaidOrder {
  id: string;
  order_number: string;
  status: string;
  total_cents: number;
  customer_name: string;
  ship_city: string;
  ship_region: string;
  paid_at: string;
}

interface AppEvent {
  id: string;
  level: 'info' | 'warning' | 'error';
  type: string;
  title: string;
  detail: string | null;
  link: string | null;
  is_test: boolean;
  created_at: string;
}

interface TelegramStatus {
  token: boolean;
  chatIds: number;
  webhookSecret: boolean;
  cronSecret: boolean;
  botName: string | null;
  connected: boolean;
  lastError: string | null;
}

const LEVEL_CHIP: Record<AppEvent['level'], { label: string; color: 'success' | 'warning' | 'error' }> = {
  info: { label: 'Info', color: 'success' },
  warning: { label: 'Warning', color: 'warning' },
  error: { label: 'Error', color: 'error' },
};

function Stat({ label, cents, orders }: { label: string; cents: number; orders: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 180px', minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>{money(cents)}</Typography>
      <Typography variant="caption" color="text.secondary">
        {orders} order{orders === 1 ? '' : 's'}{orders ? ` · avg ${money(Math.round(cents / orders))}` : ''}
      </Typography>
    </Paper>
  );
}

function AbandonedStat({ carts, cents }: { carts: number; cents: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 180px', minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Abandoned carts · 7 days</Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: carts ? 'error.main' : undefined }}>{carts}</Typography>
      <Typography variant="caption" color="text.secondary">
        {money(cents)} left behind · <Link href="/admin/abandoned-checkouts" underline="hover">See carts</Link>
      </Typography>
    </Paper>
  );
}

function Setting({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <Tooltip title={hint}>
      <Chip size="small" variant="outlined" color={ok ? 'success' : 'default'} label={`${ok ? '✓' : '✗'} ${label}`} />
    </Tooltip>
  );
}

function TelegramBox() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/telegram');
    if (response.ok) setStatus(await response.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (action: 'connect' | 'test') => {
    setBusy(action);
    setMessage(null);
    const response = await fetch('/api/admin/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok
      ? { ok: true, text: action === 'connect' ? 'Bot connected: send it /today in Telegram.' : 'Test message sent: check Telegram.' }
      : { ok: false, text: result.error || 'Failed' });
    setBusy('');
    load();
  };

  if (!status) return null;
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <TelegramIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Telegram bot{status.botName ? ` @${status.botName}` : ''}
        </Typography>
        <Chip size="small" color={status.connected ? 'success' : 'default'} label={status.connected ? 'Connected' : 'Not connected'} />
      </Stack>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
        <Setting ok={status.token} label="TELEGRAM_BOT_TOKEN" hint="The bot's token from @BotFather, in Vercel's environment variables" />
        <Setting ok={status.chatIds > 0} label="TELEGRAM_CHAT_ID" hint="Who receives alerts. Send the bot any message after connecting and it replies with your chat ID" />
        <Setting ok={status.webhookSecret} label="TELEGRAM_WEBHOOK_SECRET" hint="Any long random text; proves bot commands really come from Telegram" />
        <Setting ok={status.cronSecret} label="ALERTS_CRON_SECRET" hint="Any long random text; the n8n daily summary sends it in the X-Alerts-Key header" />
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" disabled={!status.token || !status.webhookSecret || !!busy} onClick={() => run('connect')}>
          {busy === 'connect' ? 'Connecting…' : status.connected ? 'Reconnect bot' : 'Connect bot'}
        </Button>
        <Button size="small" variant="outlined" disabled={!status.token || !status.chatIds || !!busy} onClick={() => run('test')}>
          {busy === 'test' ? 'Sending…' : 'Send test alert'}
        </Button>
      </Stack>
      {message && <Alert severity={message.ok ? 'success' : 'error'} sx={{ mt: 1.5 }}>{message.text}</Alert>}
      {!message && status.lastError && <Alert severity="warning" sx={{ mt: 1.5 }}>Telegram reported: {status.lastError}</Alert>}
    </Paper>
  );
}

export default function SalesDashboard() {
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [abandoned, setAbandoned] = useState({ carts: 0, cents: 0 });
  const [show, setShow] = useState<'all' | 'problems'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase) return;
    setError('');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const since = new Date(Math.min(monthStart.getTime(), now.getTime() - 30 * DAY_MS));
    let eventsQuery = supabase.from('app_events').select('*').order('created_at', { ascending: false }).limit(50);
    if (show === 'problems') eventsQuery = eventsQuery.in('level', ['warning', 'error']);
    // Same grouping as Admin → Abandoned checkouts: retries by one shopper count once, and a week of
    // extra history shows whether an attempt was later paid.
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    getCheckoutOrderRows(new Date(weekStart.getTime() - 7 * DAY_MS))
      .then((rows) => {
        const carts = buildCheckoutSessions(rows).filter((s) => s.outcome === 'abandoned' && s.lastAt >= weekStart);
        setAbandoned({ carts: carts.length, cents: carts.reduce((sum, s) => sum + s.valueCents, 0) });
      })
      .catch((rowsError) => console.error('Loading abandoned carts failed:', rowsError));
    const [ordersResult, eventsResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, status, total_cents, customer_name, ship_city, ship_region, paid_at')
        .eq('is_test', false)
        .in('status', PAID_STATUSES)
        .gte('paid_at', since.toISOString())
        .order('paid_at', { ascending: false }),
      eventsQuery,
    ]);
    if (ordersResult.error || eventsResult.error) {
      const failure = ordersResult.error || eventsResult.error;
      setError(failure?.message?.includes('app_events') ? 'Run the app_events migration in Supabase to see alerts here.' : failure?.message || 'Failed to load');
    }
    setOrders((ordersResult.data || []) as PaidOrder[]);
    setEvents((eventsResult.data || []) as AppEvent[]);
    setLoading(false);
  }, [show]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const total = (from: number) => {
    const rows = orders.filter((o) => new Date(o.paid_at).getTime() >= from);
    return { cents: rows.reduce((sum, o) => sum + o.total_cents, 0), orders: rows.length };
  };
  const today = total(todayStart);
  const week = total(todayStart - 6 * DAY_MS);
  const month = total(new Date(now.getFullYear(), now.getMonth(), 1).getTime());
  const days30 = total(todayStart - 29 * DAY_MS);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Dashboard</Typography>
        <Tooltip title="Refreshes every minute">
          <IconButton onClick={load}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
            <Stat label="Today" cents={today.cents} orders={today.orders} />
            <Stat label="Last 7 days" cents={week.cents} orders={week.orders} />
            <Stat label="This month" cents={month.cents} orders={month.orders} />
            <Stat label="Last 30 days" cents={days30.cents} orders={days30.orders} />
            <AbandonedStat carts={abandoned.carts} cents={abandoned.cents} />
          </Stack>

          <TelegramBox />

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6">Alerts</Typography>
                <ToggleButtonGroup size="small" exclusive value={show} onChange={(_, value) => value && setShow(value)}>
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="problems">Errors & warnings</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <Paper variant="outlined">
                {events.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2 }}>Nothing yet.</Typography>
                ) : (
                  events.map((event) => (
                    <Box key={event.id} sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
                      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                        <Chip size="small" color={LEVEL_CHIP[event.level].color} label={LEVEL_CHIP[event.level].label} />
                        {event.is_test && <Chip size="small" variant="outlined" label="TEST" />}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {event.link ? <Link href={event.link} underline="hover" color="inherit">{event.title}</Link> : event.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{when(event.created_at)}</Typography>
                      </Stack>
                      {event.detail && (
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mt: 0.5, wordBreak: 'break-word' }}>
                          {event.detail}
                        </Typography>
                      )}
                    </Box>
                  ))
                )}
              </Paper>
            </Box>

            <Box sx={{ flex: 1, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Recent paid orders</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Paid</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.slice(0, 15).map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Link href={`/admin/orders?order=${order.id}`} underline="hover">{order.order_number}</Link>
                        </TableCell>
                        <TableCell>{order.customer_name}<Typography variant="caption" color="text.secondary" display="block">{order.ship_city}, {order.ship_region}</Typography></TableCell>
                        <TableCell align="right">{money(order.total_cents)}</TableCell>
                        <TableCell>{when(order.paid_at)}</TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow><TableCell colSpan={4}><Typography color="text.secondary">No paid orders in the last 30 days.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
}
