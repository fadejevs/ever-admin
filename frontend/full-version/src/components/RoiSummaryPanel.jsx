'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import DashboardPanel from '@/components/DashboardPanel';
import { fetchRoiSummary } from '@/services/metricsService';

function formatEur(value) {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(amount);
  } catch {
    return `€${amount.toFixed(2)}`;
  }
}

function formatPct(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${(Number(value) * 100).toFixed(0)}%`;
}

function formatRoi(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${Number(value).toFixed(2)}x`;
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

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 29);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

export default function RoiSummaryPanel({ refreshSec = 120 }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const range = useMemo(() => defaultDateRange(), []);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchRoiSummary(range);
      setPayload(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load ROI');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const period = payload?.period;
  const vendorCosts = payload?.vendor_costs || {};
  const vendorEntries = Object.entries(vendorCosts.by_vendor || {}).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  const hasVendorActuals = Number(vendorCosts.total_eur || 0) > 0 || Number(period?.vendor_actual_cost_rows || 0) > 0;
  const periodLabel = `${range.startDate} → ${range.endDate}`;
  const updatedLabel = useMemo(() => {
    if (!payload?.generated_at) return '—';
    try {
      return new Date(payload.generated_at).toLocaleTimeString();
    } catch {
      return '—';
    }
  }, [payload?.generated_at]);

  return (
    <DashboardPanel
      title="ROI & vendor costs"
      subtitle={`${periodLabel} · updated ${updatedLabel}`}
      icon={InsightsOutlinedIcon}
      iconTone="pipeline"
      chips={
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={hasVendorActuals ? 'Vendor actuals in mix' : 'Estimated costs'}
            color={hasVendorActuals ? 'success' : 'default'}
            variant={hasVendorActuals ? 'filled' : 'outlined'}
          />
          <Chip size="small" variant="outlined" label={`Actual share ${formatPct(period?.vendor_actual_cost_share || period?.openai_actual_cost_share)}`} />
        </Stack>
      }
    >
      {loading && !payload ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : (
        <Stack spacing={2}>
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            <StatBlock label="Revenue" value={formatEur(period?.revenue_prorated)} />
            <StatBlock label="API cost" value={formatEur(period?.api_cost_total)} emphasis />
            <StatBlock label="Gross margin" value={formatEur(period?.gross_margin)} />
            <StatBlock label="ROI" value={formatRoi(period?.roi)} emphasis />
          </Stack>

          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            <StatBlock label="ASR" value={formatEur(period?.api_cost_asr)} />
            <StatBlock label="Translation" value={formatEur(period?.api_cost_translation)} />
            <StatBlock label="TTS" value={formatEur(period?.api_cost_tts)} />
            <StatBlock label="LLM" value={formatEur(period?.api_cost_llm)} />
          </Stack>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.75 }}>
              Vendor invoices / pulled costs
            </Typography>
            {vendorEntries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No vendor actuals in range. Confirm invoices in Expenses, or set{' '}
                <code>ROI_VENDOR_EXPENSES_JSON</code> / enable <code>ROI_OPENAI_COSTS_ENABLED</code>.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {vendorEntries.map(([vendor, amount]) => (
                  <Chip key={vendor} size="small" variant="outlined" label={`${vendor}: ${formatEur(amount)}`} />
                ))}
                <Chip size="small" color="primary" variant="outlined" label={`Pulled total ${formatEur(vendorCosts.total_eur)}`} />
              </Stack>
            )}
          </Box>
        </Stack>
      )}
    </DashboardPanel>
  );
}
