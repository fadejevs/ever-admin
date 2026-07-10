'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import axios from 'axios';
import { supabase } from '@/utils/supabase/client';

const STATUS_COLOR = {
  healthy: 'success',
  degraded: 'warning',
  critical: 'error',
  unknown: 'default'
};

const STATUS_LABEL = {
  healthy: 'OK',
  degraded: 'Slow / errors',
  critical: 'Failing',
  unknown: 'No traffic'
};

const PIPELINE_SERVICE_IDS = ['translation', 'asr', 'tts'];

function formatLatency(ms) {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const sec = ms / 1000;
  return sec < 10 ? `${sec.toFixed(1)} s` : `${Math.round(sec)} s`;
}

function describePlatformSummary(summary, redisOk, slackOk) {
  const parts = [];
  const window = summary?.windowMinutes ?? 15;

  if (summary?.offline) {
    return summary.message || 'Cannot reach the main app — health data unavailable.';
  }

  if (summary?.status === 'healthy') {
    parts.push(`Translation, ASR, and TTS look healthy over the last ${window} minutes.`);
  } else if (summary?.status === 'degraded') {
    parts.push(`Translation, ASR, or TTS is slow or under load (last ${window} min).`);
  } else if (summary?.status === 'critical') {
    parts.push(`Translation, ASR, or TTS has elevated failures (last ${window} min).`);
  } else {
    parts.push(`Not enough translation, ASR, or TTS traffic in the last ${window} minutes to score health.`);
  }

  if (!redisOk) {
    parts.push('Redis/job queue is not connected — expected in local dev without REDIS_URL.');
  }

  if (!slackOk) {
    parts.push('Slack alerts are off until SLACK_WEBHOOK_URL is set on the main app.');
  }

  return parts.join(' ');
}

async function fetchMonitoringStatus() {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await axios.get('/api/monitoring/status', { headers, timeout: 15000 });
  return data;
}

export default function MonitoringAlertsPanel({ refreshSec = 30 }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchMonitoringStatus();
      setPayload(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load monitoring status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const summary = payload?.healthSummary;
  const services = payload?.services?.services || [];
  const platform = payload?.platformHealth;
  const alerts = payload?.alerts;
  const activeIncidents = alerts?.activeIncidents || [];

  const slackOk = alerts?.slackConfigured;
  const redisOk = platform?.skipped === true || (platform?.redis !== false && platform?.ok !== false);
  const queueDepth = platform?.depth;
  const windowMinutes = summary?.windowMinutes ?? payload?.services?.windowMinutes ?? 15;

  const visibleServices = useMemo(
    () => services.filter((svc) => PIPELINE_SERVICE_IDS.includes(svc.id)),
    [services]
  );

  const summaryText = useMemo(
    () => describePlatformSummary(summary, redisOk, slackOk),
    [summary, redisOk, slackOk]
  );

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <NotificationsActiveRoundedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Monitoring & alerts
          </Typography>
          <Chip
            size="small"
            label={slackOk ? 'Slack alerts on' : 'Slack alerts off'}
            color={slackOk ? 'success' : 'default'}
            variant="outlined"
          />
          {activeIncidents.length > 0 && (
            <Chip size="small" label={`${activeIncidents.length} open incident(s)`} color="error" />
          )}
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading && !payload ? (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              {summaryText}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={`Overall: ${STATUS_LABEL[summary?.status] || 'No traffic'}`}
                color={STATUS_COLOR[summary?.status] || 'default'}
              />
              <Chip
                size="small"
                label={redisOk ? 'Job queue: connected' : 'Job queue: not connected'}
                color={redisOk ? 'success' : 'default'}
                variant="outlined"
              />
              {queueDepth != null && redisOk ? (
                <Chip
                  size="small"
                  label={`Queue backlog: ${queueDepth}`}
                  color={queueDepth >= 500 ? 'warning' : 'default'}
                  variant="outlined"
                />
              ) : null}
            </Stack>

            {visibleServices.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Failed</TableCell>
                      <TableCell align="right">Requests</TableCell>
                      <TableCell align="right">95% finish within</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleServices.map((svc) => (
                      <TableRow key={svc.id}>
                        <TableCell>{svc.name}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={STATUS_LABEL[svc.status] || svc.status}
                            color={STATUS_COLOR[svc.status] || 'default'}
                            variant={svc.status === 'unknown' ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell align="right">{svc.failures ?? 0}</TableCell>
                        <TableCell align="right">{svc.requests ?? 0}</TableCell>
                        <TableCell align="right">{formatLatency(svc.p95LatencyMs)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : null}

            <Typography variant="caption" color="text.secondary">
              &quot;No traffic&quot; = no calls to that service in the last {windowMinutes} minutes (usually fine). Data
              comes from main-app metrics ingest.
            </Typography>

            {activeIncidents.length > 0 ? (
              <Alert severity="warning">Open alerts: {activeIncidents.map((i) => i.id).join(', ')}</Alert>
            ) : null}
          </>
        )}
      </Stack>
    </Paper>
  );
}
