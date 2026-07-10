'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { fetchHealthSummary } from '@/services/metricsService';

const DEGRADED_ERROR_RATE_PCT = 5;
const DEGRADED_P95_MS = 5000;
const LATENCY_TARGET_LABEL = '5 s';

const STATUS_META = {
  healthy: { label: 'Healthy', color: 'success', Icon: CheckCircleOutlineIcon },
  degraded: { label: 'Degraded', color: 'warning', Icon: WarningAmberIcon },
  critical: { label: 'Critical', color: 'error', Icon: ErrorOutlineIcon },
  unknown: { label: 'No recent data', color: 'default', Icon: HelpOutlineIcon }
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

  if (loading || !health) {
    return (
      <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ borderRadius: 2 }}>
        Loading pipeline health…
      </Alert>
    );
  }

  if (health?.offline) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        Pipeline health unavailable — {health.message || health.error || 'Main app not reachable'}.
        {health.notDeployed ? (
          <>
            {' '}
            Deploy the latest <strong>app.everspeak.ai</strong> (includes <code>/api/health/*</code>) and set{' '}
            <code>METRICS_API_KEY</code> on both Vercel projects.
          </>
        ) : (
          <>
            {' '}
            For local dev, keep <strong>localhost:3000</strong> running and set{' '}
            <code>NEXT_PUBLIC_METRICS_API=http://localhost:3000</code> on admin.
          </>
        )}
      </Alert>
    );
  }

  if (error && !health?.offline) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        Pipeline health unavailable — {error}.
      </Alert>
    );
  }

  const status = health?.status || 'unknown';
  const meta = STATUS_META[status] || STATUS_META.unknown;
  const StatusIcon = meta.Icon;
  const alertSeverity = status === 'critical' ? 'error' : status === 'degraded' ? 'warning' : status === 'healthy' ? 'success' : 'info';

  return (
    <Alert
      severity={alertSeverity}
      icon={<StatusIcon fontSize="inherit" />}
      sx={{ borderRadius: 2, alignItems: 'flex-start' }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Pipeline health
          </Typography>
          <Chip size="small" label="Translation · ASR · TTS" variant="outlined" />
          <Chip size="small" label={meta.label} color={meta.color} variant={status === 'unknown' ? 'outlined' : 'filled'} />
        </Stack>
        <Typography variant="body2">{describeStatus(health)}</Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'max-content 1fr' },
            columnGap: 2,
            rowGap: 0.5,
            mt: 0.25
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
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Updated {formatUpdatedAt(health?.updatedAt)} · refreshes every {refreshSec}s
        </Typography>
        {error ? (
          <Typography variant="caption" color="warning.main">
            Last refresh issue: {error}
          </Typography>
        ) : null}
      </Stack>
    </Alert>
  );
}
