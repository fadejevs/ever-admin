'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import { fetchHealthSummary } from '@/services/metricsService';
import DashboardPanel from '@/components/DashboardPanel';

const DEGRADED_ERROR_RATE_PCT = 5;
const DEGRADED_P95_MS = 5000;
const LATENCY_TARGET_LABEL = '5 s';

const STATUS_META = {
  healthy: { label: 'Healthy', color: 'success', accent: 'success' },
  degraded: { label: 'Degraded', color: 'warning', accent: 'warning' },
  critical: { label: 'Critical', color: 'error', accent: 'error' },
  unknown: { label: 'No recent data', color: 'default', accent: 'info' }
};

function formatUpdatedAt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return '—';
  }
}

function formatLatency(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const sec = ms / 1000;
  return sec < 10 ? `${sec.toFixed(1)} s` : `${Math.round(sec)} s`;
}

function describeStatus(health) {
  const status = health?.status || 'unknown';
  if (status === 'unknown') {
    return 'Not enough translation, ASR, or TTS traffic in the last window to assess health.';
  }
  if (status === 'healthy') {
    return 'Error rate and response times are within normal limits.';
  }

  const issues = [];
  const errorRate = health?.errorRatePct ?? 0;
  const p95 = health?.p95LatencyMs ?? 0;

  if (errorRate >= DEGRADED_ERROR_RATE_PCT) {
    issues.push(`${errorRate}% of requests failed`);
  }
  if (p95 >= DEGRADED_P95_MS) {
    issues.push(`responses are slow (95% finish within ${formatLatency(p95)}, target under ${LATENCY_TARGET_LABEL})`);
  }

  if (status === 'critical') {
    return issues.length ? `Critical — ${issues.join('; ')}.` : 'Critical — elevated failures detected.';
  }
  return issues.length ? `Degraded — ${issues.join('; ')}.` : 'Degraded — one or more metrics are outside normal limits.';
}

export default function PlatformHealthIndicator({ refreshSec = 20 }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchHealthSummary({}, { retries: 4, retryDelayMs: 1200 });
      setHealth(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load platform health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const status = health?.status || 'unknown';
  const meta = STATUS_META[status] || STATUS_META.unknown;

  return (
    <DashboardPanel
      title="Pipeline health"
      subtitle={health ? describeStatus(health) : 'Translation, ASR, and TTS request quality.'}
      icon={MonitorHeartOutlinedIcon}
      iconTone="pipeline"
      accent={health ? meta.accent : null}
      chips={
        <>
          <Chip size="small" label="Translation · ASR · TTS" variant="outlined" />
          {health ? (
            <Chip size="small" label={meta.label} color={meta.color} variant={status === 'unknown' ? 'outlined' : 'filled'} />
          ) : null}
        </>
      }
      footer={health ? `Updated ${formatUpdatedAt(health?.updatedAt)} · refreshes every ${refreshSec}s` : null}
    >
      {loading && !health ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">Loading pipeline health…</Typography>
        </Stack>
      ) : null}

      {health?.offline ? <Alert severity="warning">Pipeline health unavailable</Alert> : null}

      {error && !health?.offline ? <Alert severity="warning">Pipeline health unavailable</Alert> : null}

      {health && !health.offline ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'max-content 1fr' },
            columnGap: 2,
            rowGap: 0.75,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Last {health?.windowMinutes ?? 15} min
          </Typography>
          <Typography variant="body2">
            {health?.totalRequests ?? 0} requests
            {(health?.failures ?? 0) > 0 ? ` · ${health.failures} failed` : ' · no failures'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Error rate
          </Typography>
          <Typography variant="body2">{health?.errorRatePct ?? '—'}%</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Avg response
          </Typography>
          <Typography variant="body2">{formatLatency(health?.avgLatencyMs)}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            95% finish within
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: (health?.p95LatencyMs ?? 0) >= DEGRADED_P95_MS ? 'warning.dark' : 'text.primary' }}
          >
            {formatLatency(health?.p95LatencyMs)}
            {(health?.p95LatencyMs ?? 0) >= DEGRADED_P95_MS ? ` (above ${LATENCY_TARGET_LABEL} target)` : ''}
          </Typography>
        </Box>
      ) : null}
    </DashboardPanel>
  );
}
