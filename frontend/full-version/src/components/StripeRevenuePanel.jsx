'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ExpandableTableSection from '@/components/ExpandableTableSection';
import DashboardPanel from '@/components/DashboardPanel';
import StripeMark from '@/components/icons/StripeMark';
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
  return 'https://dashboard.stripe.com';
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

function StatBlock({ label, value, emphasis = false }) {
  return (
    <Box sx={{ minWidth: 100 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
        {label}
      </Typography>
      <Typography variant={emphasis ? 'h6' : 'body1'} sx={{ fontWeight: emphasis ? 800 : 600, lineHeight: 1.3 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function StripeRevenuePanel({ refreshSec = 60 }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableExpanded, setTableExpanded] = useState(false);

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

  const transactions = payload?.transactions || [];

  return (
    <DashboardPanel
      title="Stripe revenue"
      subtitle={`From webhook ledger · ${periodLabel}`}
      iconNode={<StripeMark size={24} />}
      iconTone="neutral"
      actions={
        <Link
          href={stripeBase}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          variant="body2"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontWeight: 600,
            flexShrink: 0
          }}
        >
          Open Stripe dashboard
          <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
        </Link>
      }
      chips={
        <>
          <Chip size="small" label="live mode only" variant="outlined" color="success" />
          {transactions.length > 0 ? <Chip size="small" label={`${transactions.length} in table`} variant="outlined" /> : null}
        </>
      }
      footer={`Updated ${updatedLabel} · refreshes every ${refreshSec}s · not estimated ROI`}
      footerSlot={
        transactions.length > 0 ? (
          <ExpandableTableSection
            count={transactions.length}
            itemLabel="transactions"
            expanded={tableExpanded}
            onToggle={() => setTableExpanded((v) => !v)}
          >
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
                {transactions.map((row) => (
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
          </ExpandableTableSection>
        ) : null
      }
    >
      {loading && !payload ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">Loading Stripe ledger…</Typography>
        </Stack>
      ) : null}

      {error && !payload ? <Alert severity="warning">{error}</Alert> : null}

      {payload && !payload.configured ? <Alert severity="info">{payload.message}</Alert> : null}

      {totals ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2.5}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <StatBlock label="Net collected" value={formatMoney(totals.netCents, currency)} emphasis />
          <StatBlock label="Gross" value={formatMoney(totals.grossCents, currency)} />
          <StatBlock label="Refunds" value={formatMoney(totals.refundCents, currency)} />
          <StatBlock label="Transactions" value={totals.transactionCount} />
        </Stack>
      ) : null}

      {!loading && payload?.configured && transactions.length === 0 ? (
        <Alert severity="info">No Stripe charges recorded in this period yet.</Alert>
      ) : null}

      {error && payload ? (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
          Last refresh failed: {error}
        </Typography>
      ) : null}
    </DashboardPanel>
  );
}
