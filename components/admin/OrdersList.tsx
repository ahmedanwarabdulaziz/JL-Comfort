'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getOrderWithHistory, getOrders, runOrderAction } from '@/lib/data/orders';
import { CARRIERS, ORDER_STATUS_LABELS, Order, OrderStatus } from '@/lib/types/order';

const FILTERS: Record<string, { label: string; statuses?: OrderStatus[] }> = {
  open: { label: 'Open', statuses: ['paid', 'sent_to_supplier', 'shipped', 'problem'] },
  done: { label: 'Delivered & closed', statuses: ['delivered', 'closed'] },
  cancelled: { label: 'Cancelled', statuses: ['cancelled'] },
  abandoned: { label: 'Abandoned checkouts', statuses: ['pending_payment', 'expired'] },
  all: { label: 'All' },
};

const STATUS_COLORS: Partial<Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'>> = {
  paid: 'warning',
  sent_to_supplier: 'info',
  shipped: 'primary',
  delivered: 'success',
  closed: 'default',
  problem: 'error',
  cancelled: 'default',
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const when = (d: Date | null) => (d ? d.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export const StatusChip = ({ status }: { status: OrderStatus }) => (
  <Chip size="small" label={ORDER_STATUS_LABELS[status]} color={STATUS_COLORS[status] || 'default'} variant={status === 'closed' ? 'outlined' : 'filled'} />
);

function ShipForm({ order, onDone }: { order: Order; onDone: (o: Order, message: string, ok: boolean) => void }) {
  const [carrier, setCarrier] = useState('ups');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const { ok, order: updated } = await runOrderAction(order.id, {
        action: 'ship',
        carrier: carrier === 'other' ? 'Other' : carrier,
        trackingNumber,
        trackingUrl: carrier === 'other' ? trackingUrl : undefined,
      });
      onDone(updated, ok ? 'Marked shipped and the customer was emailed their tracking number.' : 'Marked shipped, but the email to the customer failed. See the history below.', ok);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom>Add tracking (from Charlotte&apos;s shipped email)</Typography>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 1.5 }}>
        <FormControl size="small">
          <InputLabel id="carrier-label">Carrier</InputLabel>
          <Select labelId="carrier-label" label="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            <MenuItem value="other">Other…</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" label="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
        {carrier === 'other' && (
          <TextField size="small" label="Tracking link (https://…)" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} sx={{ gridColumn: { sm: 'span 2' } }} />
        )}
      </Box>
      <Button variant="contained" sx={{ mt: 1.5 }} disabled={busy || !trackingNumber.trim()} onClick={submit}>
        {busy ? 'Saving…' : 'Mark shipped & email customer'}
      </Button>
    </Box>
  );
}

function OrderDetail({ orderId, onClose, onChanged }: { orderId: string; onClose: () => void; onChanged: () => void }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOrderWithHistory(orderId).then(setOrder).catch((err) => setMessage({ ok: false, text: err.message }));
  }, [orderId]);

  const act = async (body: Record<string, unknown>, success: string) => {
    if (!order) return;
    setBusy(true);
    setMessage(null);
    try {
      const { ok, order: updated } = await runOrderAction(order.id, body);
      setOrder(updated);
      setMessage(ok ? { ok: true, text: success } : { ok: false, text: 'That did not go through. See the history below for the reason.' });
      onChanged();
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const supplierItems = order?.items.filter((i) => i.fulfilledBy === 'supplier') || [];
  const paid = order && order.status !== 'pending_payment' && order.status !== 'expired';

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 6 }}>
        {order ? `Order ${order.orderNumber}` : 'Order'} {order && <StatusChip status={order.status} />}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!order ? (
          message ? <Alert severity="error">{message.text}</Alert> : <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            {message && <Alert severity={message.ok ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Customer</Typography>
                <Typography>{order.customerName}</Typography>
                <Typography variant="body2">{order.customerEmail}</Typography>
                {order.customerPhone && <Typography variant="body2">{order.customerPhone}</Typography>}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Placed {when(order.createdAt)}{order.paidAt ? ` · Paid ${when(order.paidAt)}` : ''}
                </Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Ship to</Typography>
                <Typography variant="body2">
                  {order.customerName}<br />
                  {order.shipLine1}{order.shipLine2 ? <><br />{order.shipLine2}</> : null}<br />
                  {order.shipCity} {order.shipRegion} {order.shipPostalCode}<br />
                  {order.shipCountry}
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Fulfilled by</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" label={item.fulfilledBy === 'supplier' ? 'Charlotte' : 'Workshop'} />
                      </TableCell>
                      <TableCell align="right">{item.quantity}{item.itemType === 'fabric' || item.itemType === 'vinyl' ? ' yd' : ''}</TableCell>
                      <TableCell align="right">{money(item.amountCents)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow><TableCell colSpan={3} align="right">Shipping</TableCell><TableCell align="right">{money(order.shippingCents)}</TableCell></TableRow>
                  {order.taxes.map((tax) => (
                    <TableRow key={tax.label}><TableCell colSpan={3} align="right">{tax.label}</TableCell><TableCell align="right">{money(tax.amountCents)}</TableCell></TableRow>
                  ))}
                  <TableRow><TableCell colSpan={3} align="right"><strong>Total charged</strong></TableCell><TableCell align="right"><strong>{money(order.totalCents)} {order.currency.toUpperCase()}</strong></TableCell></TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {paid && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Shipping</Typography>
                {order.trackingNumber ? (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {order.carrier} · {order.trackingUrl ? <a href={order.trackingUrl} target="_blank" rel="noreferrer">{order.trackingNumber}</a> : order.trackingNumber}
                    {' '}· shipped {when(order.shippedAt)}
                  </Typography>
                ) : supplierItems.length > 0 && !order.supplierEmailedAt ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>The purchase order has not been sent to Charlotte yet. Check the history below, then use &quot;Resend PO to Charlotte&quot;.</Alert>
                ) : null}
                {!order.trackingNumber && ['paid', 'sent_to_supplier', 'problem'].includes(order.status) && (
                  <ShipForm order={order} onDone={(updated, text, ok) => { setOrder(updated); setMessage({ ok, text }); onChanged(); }} />
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, alignItems: 'center' }}>
                  {supplierItems.length > 0 && (
                    <Button size="small" variant="outlined" disabled={busy} onClick={() => act({ action: 'resend_supplier_po' }, 'Purchase order emailed to Charlotte.')}>
                      {order.supplierEmailedAt ? 'Resend PO to Charlotte' : 'Send PO to Charlotte'}
                    </Button>
                  )}
                  <Button size="small" variant="outlined" disabled={busy} onClick={() => act({ action: 'resend_confirmation' }, 'Order confirmation re-sent to the customer.')}>
                    Resend confirmation
                  </Button>
                  {order.trackingNumber && (
                    <Button size="small" variant="outlined" disabled={busy} onClick={() => act({ action: 'resend_shipped' }, 'Shipping email re-sent to the customer.')}>
                      Resend shipped email
                    </Button>
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  <FormControl size="small" sx={{ minWidth: 190 }}>
                    <InputLabel id="status-label">Change status</InputLabel>
                    <Select
                      labelId="status-label"
                      label="Change status"
                      value=""
                      disabled={busy}
                      onChange={(e) => {
                        const status = e.target.value as OrderStatus;
                        if (window.confirm(`Change ${order.orderNumber} to "${ORDER_STATUS_LABELS[status]}"? No email is sent for this.`)) {
                          act({ action: 'set_status', status }, `Status changed to ${ORDER_STATUS_LABELS[status]}.`);
                        }
                      }}
                    >
                      {(['delivered', 'closed', 'problem', 'cancelled', 'sent_to_supplier', 'paid'] as OrderStatus[])
                        .filter((s) => s !== order.status)
                        .map((s) => <MenuItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                {order.status === 'cancelled' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Cancelling here does not refund the customer. Issue the refund in the Stripe dashboard.
                  </Typography>
                )}
              </>
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>History</Typography>
            {order.events.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Nothing yet.</Typography>
            ) : (
              order.events.map((event) => (
                <Box key={event.id} sx={{ display: 'flex', gap: 2, py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 150, pt: 0.2 }}>{when(event.createdAt)}</Typography>
                  <Typography variant="body2" color={event.type === 'email_failed' ? 'error' : 'text.primary'}>{event.message}</Typography>
                </Box>
              ))
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function OrdersList() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('open');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openOrderId, setOpenOrderId] = useState<string | null>(searchParams?.get('order') || null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await getOrders(FILTERS[filter].statuses));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5">Orders</Typography>
        <Button startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Box>

      <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, value) => value && setFilter(value)} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(FILTERS).map(([key, f]) => <ToggleButton key={key} value={key}>{f.label}</ToggleButton>)}
      </ToggleButtonGroup>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No orders here yet.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Ship to</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => setOpenOrderId(order.id)}>
                  <TableCell><strong>{order.orderNumber}</strong></TableCell>
                  <TableCell>{order.createdAt.toLocaleDateString('en-CA', { dateStyle: 'medium' })}</TableCell>
                  <TableCell>{order.customerName}<br /><Typography variant="caption" color="text.secondary">{order.customerEmail}</Typography></TableCell>
                  <TableCell>{order.shipCity}, {order.shipRegion}</TableCell>
                  <TableCell>{order.items.length} item{order.items.length === 1 ? '' : 's'}</TableCell>
                  <TableCell align="right">{money(order.totalCents)}</TableCell>
                  <TableCell><StatusChip status={order.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {openOrderId && <OrderDetail orderId={openOrderId} onClose={() => setOpenOrderId(null)} onChanged={load} />}
    </Box>
  );
}
