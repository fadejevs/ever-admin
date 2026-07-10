'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import { fetchStripeRevenue } from '@/services/stripeRevenueService';

function formatMoney(cents, currency = 'EUR') {
  const amount = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'EUR' }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function stripeDashboardBase() {
  const raw = process.env.NEXT_PUBLIC_STRIPE_DASHBOARD_BASE?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return 'https://dashboard.stripe.com/test';
}

function stripeResourceUrl(row) {
  const base = stripeDashboardBase();
  if (row.stripePaymentIntentId) return `${base}/payments/${row.stripePaymentIntentId}`;
  if (row.stripeInvoiceId) return `${base}/invoices/${row.stripeInvoiceId}`;
  if (row.stripeRefundId) return `${base}/refunds/${row.stripeRefundId}`;
  return `${base}/payments`;
}

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '—';
  }
}

export default function StripeRevenuePanel({ refreshSec = 60 }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchStripeRevenue();
      setPayload(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load Stripe revenue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const totals = payload?.totals;
  const currency = payload?.transactions?.[0]?.currency || 'EUR';
  const stripeBase = stripeDashboardBase();
  const periodLabel = payload?.startDate && payload?.endDate ? `${payload.startDate} → ${payload.endDate}` : 'Last 30 days';
  const updatedLabel = useMemo(() => {
    if (!payload?.updatedAt) return '—';
    try {
      return new Date(payload.updatedAt).toLocaleTimeString();
    } catch {
      return '—';
    }
  }, [payload?.updatedAt]);

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PaymentsRoundedIcon sx={{ color: 'success.main', fontSize: 20 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Stripe revenue
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              From webhook ledger · {periodLabel}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" label="billing_transactions" variant="outlined" />
          <Link href={stripeBase} target="_blank" rel="noopener noreferrer" variant="body2" underline="hover">
            Open Stripe →
          </Link>
        </Stack>
      </Stack>

      {loading && !payload ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">Loading Stripe ledger…</Typography>
        </Stack>
      ) : null}

      {error && !payload ? <Alert severity="warning">{error}</Alert> : null}

      {payload && !payload.configured ? (
        <Alert severity="info">{payload.message}</Alert>
      ) : null}

      {totals ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Net collected
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {formatMoney(totals.netCents, currency)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Gross
            </Typography>
            <Typography variant="body1">{formatMoney(totals.grossCents, currency)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Refunds
            </Typography>
            <Typography variant="body1">{formatMoney(totals.refundCents, currency)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Transactions
            </Typography>
            <Typography variant="body1">{totals.transactionCount}</Typography>
          </Box>
        </Stack>
      ) : null}

      {payload?.transactions?.length ? (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Stripe</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payload.transactions.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {formatWhen(row.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.typeLabel}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.customerEmail || '—'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {row.workspaceName || row.workspaceId || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: row.amountCents < 0 ? 'error.main' : 'success.dark' }}>
                    {formatMoney(row.amountCents, row.currency)}
                  </TableCell>
                  <TableCell align="right">
                    <Link href={stripeResourceUrl(row)} target="_blank" rel="noopener noreferrer" underline="hover" variant="body2">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : payload?.configured ? (
        <Alert severity="info">No Stripe charges recorded in this period yet.</Alert>
      ) : null}

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
        Updated {updatedLabel} · refreshes every {refreshSec}s · not estimated ROI
      </Typography>

      {error && payload ? (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
          Last refresh failed: {error}
        </Typography>
      ) : null}
    </Paper>
  );
}
