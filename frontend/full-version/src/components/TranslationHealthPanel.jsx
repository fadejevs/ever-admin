'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import { fetchServiceHealth } from '@/services/metricsService';

const STATUS_COLOR = {
  healthy: 'success',
  degraded: 'warning',
  critical: 'error',
  unknown: 'default'
};

function formatLatency(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export default function TranslationHealthPanel({ refreshSec = 20 }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchServiceHealth();
      setPayload(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load translation health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const translation = useMemo(
    () => (payload?.services || []).find((svc) => svc.id === 'translation') || null,
    [payload?.services]
  );

  const updatedLabel = useMemo(() => {
    if (!payload?.updatedAt) return '—';
    try {
      return new Date(payload.updatedAt).toLocaleTimeString();
    } catch {
      return '—';
    }
  }, [payload?.updatedAt]);

  const status = translation?.status || 'unknown';
  const chipColor = STATUS_COLOR[status] || 'default';

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <TranslateRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Translation API
        </Typography>
        {translation ? (
          <Chip size="small" label={status} color={chipColor} variant={status === 'unknown' ? 'outlined' : 'filled'} />
        ) : null}
      </Stack>

      {loading && !payload ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">Loading…</Typography>
        </Stack>
      ) : null}

      {error && !payload ? <Alert severity="warning">{error}</Alert> : null}

      {translation ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {translation.requests ?? 0} requests · {translation.errorRatePct ?? 0}% errors · avg {formatLatency(translation.avgLatencyMs)} ·
          P95 {formatLatency(translation.p95LatencyMs)}
        </Typography>
      ) : payload ? (
        <Alert severity="info">No translation traffic in the last 15 minutes.</Alert>
      ) : null}

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
        Updated {updatedLabel} · from metrics ingest
      </Typography>
    </Paper>
  );
}
