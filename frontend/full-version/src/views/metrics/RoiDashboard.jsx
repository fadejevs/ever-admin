'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { useTheme, alpha, keyframes } from '@mui/material/styles';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import { Area, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchRoiCustomers, fetchRoiEvents, fetchRoiSummary } from '@/services/metricsService';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

function formatCurrency(value) {
  return `€${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatHours(seconds) {
  return `${(Number(seconds || 0) / 3600).toLocaleString(undefined, { maximumFractionDigits: 1 })}h`;
}

function formatRuntime(seconds) {
  const s = Number(seconds || 0);
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return formatHours(s);
}

function formatRuntimeFromMinutes(minutes) {
  const m = Number(minutes || 0);
  if (m < 60) return `${Math.round(m)}m`;
  return `${(m / 60).toFixed(1)}h`;
}

function formatCustomerLabel(row) {
  if (row?.customer_email) return row.customer_email;
  const id = row?.customer_id || '';
  if (!id) return 'Unknown customer';
  return id.length > 14 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function isoDateDaysAgo(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function shortDayLabel(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const [y, m, d] = iso.split('-');
  if (!m || !d) return iso;
  return `${m}/${d}`;
}

function KPI({ title, value, hint, accent, icon: Icon }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: 2.25,
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.9),
        background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(
          accent,
          0.06
        )} 100%)`,
        boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}, 0 12px 40px ${alpha(accent, 0.1)}`,
        animation: `${fadeUp} 0.55s ease-out both`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0.45)})`
        }
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(accent, 0.14),
            color: accent,
            flexShrink: 0
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.2, textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.25, mt: 0.25 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.45 }}>
        {hint}
      </Typography>
    </Paper>
  );
}

export default function RoiDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [events, setEvents] = useState([]);
  const [horizon, setHorizon] = useState('30d');

  const [filters, setFilters] = useState({
    startDate: isoDateDaysAgo(29),
    endDate: todayIso(),
    planTier: ''
  });

  const chartColors = useMemo(
    () => ({
      runtime: theme.palette.primary.main,
      cost: theme.palette.secondary.main,
      revenue: theme.palette.success.main,
      grid: alpha(theme.palette.divider, 0.85)
    }),
    [theme.palette.divider, theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main]
  );

  const query = useMemo(() => {
    const out = {};
    if (filters.startDate) out.startDate = filters.startDate;
    if (filters.endDate) out.endDate = filters.endDate;
    if (filters.planTier) out.planTier = filters.planTier;
    return out;
  }, [filters]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [summaryRes, customersRes, eventsRes] = await Promise.all([
          fetchRoiSummary(query),
          fetchRoiCustomers(query),
          fetchRoiEvents(query)
        ]);
        if (!mounted) return;
        setSummary(summaryRes?.daily || []);
        setCustomers(customersRes?.customers || []);
        setEvents(eventsRes?.events || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || e?.message || 'Failed to load ROI dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [query]);

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, row) => {
        acc.runtime += row.runtime_seconds || 0;
        acc.cost += row.api_cost_total || 0;
        acc.revenue += row.revenue_prorated || 0;
        acc.margin += row.gross_margin || 0;
        acc.fallbackRows += row.fallback_rows || 0;
        acc.totalRows += row.total_rows || 0;
        return acc;
      },
      { runtime: 0, cost: 0, revenue: 0, margin: 0, fallbackRows: 0, totalRows: 0 }
    );
  }, [summary]);

  const overallRoi = totals.cost > 0 ? totals.margin / totals.cost : null;
  const fallbackShare = totals.totalRows > 0 ? totals.fallbackRows / totals.totalRows : 0;
  const estimatedCostShare = useMemo(() => {
    if (!summary.length) return 0;
    const estRows = summary.reduce((acc, row) => acc + Number(row.estimated_cost_rows || 0), 0);
    const totalRows = summary.reduce((acc, row) => acc + Number(row.total_rows || 0), 0);
    return totalRows > 0 ? estRows / totalRows : 0;
  }, [summary]);
  const usageRevenueEstimatedShare = useMemo(() => {
    if (!summary.length) return 0;
    const estimatedRevenueRows = summary.reduce((acc, row) => acc + Number(row.usage_estimated_revenue_rows || 0), 0);
    const totalRows = summary.reduce((acc, row) => acc + Number(row.total_rows || 0), 0);
    return totalRows > 0 ? estimatedRevenueRows / totalRows : 0;
  }, [summary]);
  const usageOverageRevenueShare = useMemo(() => {
    if (!summary.length) return 0;
    const overageRows = summary.reduce((acc, row) => acc + Number(row.usage_overage_revenue_rows || 0), 0);
    const totalRows = summary.reduce((acc, row) => acc + Number(row.total_rows || 0), 0);
    return totalRows > 0 ? overageRows / totalRows : 0;
  }, [summary]);
  const openAiActualCostShare = useMemo(() => {
    if (!summary.length) return 0;
    const actualRows = summary.reduce((acc, row) => acc + Number(row.openai_actual_cost_rows || 0), 0);
    const totalRows = summary.reduce((acc, row) => acc + Number(row.total_rows || 0), 0);
    return totalRows > 0 ? actualRows / totalRows : 0;
  }, [summary]);
  const topCustomers = customers.slice(0, 8);
  const topEvents = events.slice(0, 8);
  const hasMonetaryData = totals.cost > 0 || totals.revenue > 0;
  const hasRuntimeData = totals.runtime > 0;
  const periodLabel = filters.startDate && filters.endDate ? `${filters.startDate} → ${filters.endDate}` : 'All time';
  const emailsResolvedCount = customers.filter((row) => Boolean(row.customer_email)).length;
  const chartData = useMemo(
    () =>
      summary.map((row) => ({
        ...row,
        runtime_minutes: Number((Number(row.runtime_seconds || 0) / 60).toFixed(1))
      })),
    [summary]
  );

  const handleHorizonChange = (value) => {
    setHorizon(value);
    if (value === 'custom') return;

    const days = value === '30d' ? 29 : value === '90d' ? 89 : value === '180d' ? 179 : value === '365d' ? 364 : null;
    if (days === null) {
      setFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
      return;
    }
    setFilters((prev) => ({ ...prev, startDate: isoDateDaysAgo(days), endDate: todayIso() }));
  };

  const pageBg = useMemo(
    () =>
      `radial-gradient(1200px 600px at 10% -10%, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 55%),
       radial-gradient(900px 500px at 100% 0%, ${alpha(theme.palette.success.main, 0.1)} 0%, transparent 50%),
       linear-gradient(180deg, ${theme.palette.grey[100]} 0%, ${theme.palette.background.default} 38%, ${theme.palette.grey[50]} 100%)`,
    [theme.palette.background.default, theme.palette.grey, theme.palette.primary.main, theme.palette.success.main]
  );

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '70vh', background: pageBg }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={28} thickness={4} sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Loading ROI data…
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rounded" height={132} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '50vh', background: pageBg }}>
        <Alert severity="error" sx={{ borderRadius: 2, boxShadow: 1 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        pb: 5,
        minHeight: '100%',
        background: pageBg
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.12),
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(
              theme.palette.primary.lighter,
              0.35
            )} 45%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            boxShadow: `0 24px 80px ${alpha(theme.palette.primary.dark, 0.12)}`,
            animation: `${fadeUp} 0.5s ease-out both`
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'flex-start' }}
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="overline"
                sx={{ color: 'primary.dark', fontWeight: 700, letterSpacing: 1.2, display: 'block', mb: 0.5 }}
              >
                Operations
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: -0.5, lineHeight: 1.15 }}>
                ROI dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1, maxWidth: 560, lineHeight: 1.5 }}>
                Live usage, inferred API spend, and usage-priced revenue — <strong>{periodLabel}</strong>
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Plan tier</InputLabel>
              <Select
                value={filters.planTier}
                label="Plan tier"
                onChange={(e) => setFilters((prev) => ({ ...prev, planTier: e.target.value }))}
                sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.85) }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="free">free</MenuItem>
                <MenuItem value="starter">starter</MenuItem>
                <MenuItem value="pro">pro</MenuItem>
                <MenuItem value="business">business</MenuItem>
                <MenuItem value="enterprise">enterprise</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 1.75,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.paper, 0.72),
            backdropFilter: 'blur(8px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}`
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={horizon}
              onChange={(_, value) => value && handleHorizonChange(value)}
              sx={{
                flexWrap: 'wrap',
                gap: 0.5,
                '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: '10px !important', mx: 0 },
                '& .MuiToggleButton-root': {
                  px: 1.75,
                  py: 0.75,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px !important',
                  border: `1px solid ${alpha(theme.palette.divider, 0.9)} !important`,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.14),
                    color: 'primary.dark',
                    borderColor: `${alpha(theme.palette.primary.main, 0.35)} !important`
                  }
                }
              }}
            >
              <ToggleButton value="30d">30d</ToggleButton>
              <ToggleButton value="90d">90d</ToggleButton>
              <ToggleButton value="180d">180d</ToggleButton>
              <ToggleButton value="365d">365d</ToggleButton>
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="custom">Custom</ToggleButton>
            </ToggleButtonGroup>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
              <TextField
                size="small"
                label="Start"
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setHorizon('custom');
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.9) }
                }}
              />
              <TextField
                size="small"
                label="End"
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setHorizon('custom');
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.9) }
                }}
              />
            </Stack>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <KPI
              title="Runtime"
              value={formatRuntime(totals.runtime)}
              hint="Best-available minutes from sessions, else event elapsed time."
              accent={chartColors.runtime}
              icon={AccessTimeRoundedIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPI
              title="API cost"
              value={formatCurrency(totals.cost)}
              hint="Blended provider costs for the range (actual where wired, else estimates)."
              accent={chartColors.cost}
              icon={PaymentsRoundedIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPI
              title="Revenue"
              value={formatCurrency(totals.revenue)}
              hint="Usage-priced model: runtime × target languages × configured €/h."
              accent={chartColors.revenue}
              icon={SavingsRoundedIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPI
              title="Margin / ROI"
              value={`${formatCurrency(totals.margin)} · ${formatPercent(overallRoi)}`}
              hint="Gross margin vs API spend in this window (null ROI when plan has no cost)."
              accent={theme.palette.info.main}
              icon={InsightsRoundedIcon}
            />
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.paper, 0.65)
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
            Data quality & coverage
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip size="small" label={`Rows ${totals.totalRows}`} sx={{ fontWeight: 600, borderRadius: 2 }} />
            <Chip
              size="small"
              label={`Fallback runtime ${formatPercent(fallbackShare)}`}
              color={fallbackShare > 0.2 ? 'warning' : 'success'}
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: 2 }}
            />
            <Chip size="small" label={`Est. cost rows ${formatPercent(estimatedCostShare)}`} variant="outlined" sx={{ borderRadius: 2 }} />
            <Chip size="small" label={`OpenAI actual ${formatPercent(openAiActualCostShare)}`} variant="outlined" sx={{ borderRadius: 2 }} />
            <Chip size="small" label={`Est. revenue ${formatPercent(usageRevenueEstimatedShare)}`} variant="outlined" sx={{ borderRadius: 2 }} />
            <Chip size="small" label={`Free overage ${formatPercent(usageOverageRevenueShare)}`} variant="outlined" sx={{ borderRadius: 2 }} />
            <Chip
              size="small"
              label={`Emails resolved ${emailsResolvedCount}/${customers.length}`}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            {!hasMonetaryData && (
              <Chip size="small" label="Cost/revenue sparse in source" color="warning" variant="outlined" sx={{ borderRadius: 2 }} />
            )}
          </Stack>
        </Paper>

        {!hasRuntimeData && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            No runtime found for this date range. Try 90 days or All.
          </Alert>
        )}

        {!hasMonetaryData && hasRuntimeData && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Runtime data is present, but cost/revenue fields are zero in source rows for this period.
          </Alert>
        )}

        {emailsResolvedCount === 0 && customers.length > 0 && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Customer emails cannot be resolved with anon-only DB access. Add `SUPABASE_SERVICE_ROLE_KEY` to server env so the dashboard can map
            `created_by` user IDs to emails.
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.1),
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(
              theme.palette.background.paper,
              0.92
            )} 22%, ${theme.palette.background.paper} 100%)`,
            boxShadow: `0 20px 64px ${alpha(theme.palette.common.black, 0.07)}`,
            animation: `${fadeUp} 0.55s ease-out 0.08s both`
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }} spacing={1}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.3 }}>
                Daily performance
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Runtime scales on the right; euros on the left.
              </Typography>
            </Box>
            <Chip
              label={`Fallback ${formatPercent(fallbackShare)}`}
              color={fallbackShare > 0.2 ? 'warning' : 'success'}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600, borderRadius: 2 }}
            />
          </Stack>
          {summary.length === 0 ? (
            <Typography color="text.secondary">No data for selected filters.</Typography>
          ) : (
            <Box sx={{ height: 360, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="runtimeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={alpha(chartColors.runtime, 0.35)} />
                      <stop offset="100%" stopColor={alpha(chartColors.runtime, 0)} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 8" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: chartColors.grid }}
                    tickFormatter={shortDayLabel}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="money"
                    orientation="left"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `€${v}`}
                    width={48}
                  />
                  <YAxis
                    yAxisId="runtime"
                    orientation="right"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatRuntimeFromMinutes(value)}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                      boxShadow: `0 16px 40px ${alpha(theme.palette.common.black, 0.12)}`,
                      background: alpha(theme.palette.background.paper, 0.98)
                    }}
                    labelStyle={{ fontWeight: 700, marginBottom: 6 }}
                    formatter={(value, name) => {
                      if (name === 'Runtime') return [formatRuntimeFromMinutes(value), name];
                      return [`€${Number(value || 0).toFixed(2)}`, name];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 12 }}
                    formatter={(value) => <span style={{ color: theme.palette.text.secondary, fontSize: 12 }}>{value}</span>}
                  />
                  <Area
                    yAxisId="runtime"
                    type="monotone"
                    dataKey="runtime_minutes"
                    stroke="none"
                    fill="url(#runtimeFill)"
                    name="Runtime"
                    legendType="none"
                    isAnimationActive
                    animationDuration={900}
                  />
                  <Line
                    yAxisId="runtime"
                    type="monotone"
                    dataKey="runtime_minutes"
                    stroke={chartColors.runtime}
                    name="Runtime"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: chartColors.runtime }}
                    isAnimationActive
                    animationDuration={900}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="api_cost_total"
                    stroke={chartColors.cost}
                    name="Cost (€)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: chartColors.cost }}
                    isAnimationActive
                    animationDuration={900}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="revenue_prorated"
                    stroke={chartColors.revenue}
                    name="Revenue (€)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: chartColors.revenue }}
                    isAnimationActive
                    animationDuration={900}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.06)}`,
                animation: `${fadeUp} 0.55s ease-out 0.12s both`
              }}
            >
              <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Top customers
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  By revenue in this range
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 340 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>Customer</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>
                        Runtime
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>
                        Cost
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>
                        Revenue
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>
                        ROI
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCustomers.map((row, idx) => (
                      <TableRow
                        key={row.customer_id}
                        hover
                        sx={{ '&:nth-of-type(even)': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                      >
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, maxWidth: 180 }}>{formatCustomerLabel(row)}</TableCell>
                        <TableCell align="right">{formatRuntime(row.runtime_seconds)}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(row.api_cost_total)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.dark', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(row.revenue_prorated)}
                        </TableCell>
                        <TableCell align="right">{formatPercent(row.roi)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.06)}`,
                animation: `${fadeUp} 0.55s ease-out 0.16s both`
              }}
            >
              <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Top events
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Highest revenue events
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 340 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>Event</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>Customer</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>
                        Runtime
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>
                        Cost
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>
                        Revenue
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topEvents.map((row, idx) => (
                      <TableRow
                        key={`${row.day}-${row.event_id}`}
                        hover
                        sx={{ '&:nth-of-type(even)': { bgcolor: alpha(theme.palette.success.main, 0.03) } }}
                      >
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, maxWidth: 200 }}>{row.event_title}</TableCell>
                        <TableCell sx={{ maxWidth: 160 }}>{formatCustomerLabel(row)}</TableCell>
                        <TableCell align="right">{formatRuntime(row.runtime_seconds)}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(row.api_cost_total)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.dark', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(row.revenue_prorated)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
