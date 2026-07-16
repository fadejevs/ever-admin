'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import axios from 'axios';
import { supabase } from '@/utils/supabase/client';
import DashboardPanel from '@/components/DashboardPanel';

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
const LOAD_RETRIES = 4;
const LOAD_RETRY_MS = 1200;

function formatLatency(ms) {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const sec = ms / 1000;
  return sec < 10 ? `${sec.toFixed(1)} s` : `${Math.round(sec)} s`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const load = useCallback(async ({ initial = false } = {}) => {
    if (initial) setLoading(true);

    try {
      setError('');
      let lastError = null;

      for (let attempt = 0; attempt < LOAD_RETRIES; attempt += 1) {
        try {
          const data = await fetchMonitoringStatus();
          setPayload(data);
          return;
        } catch (e) {
          lastError = e;
          if (attempt < LOAD_RETRIES - 1) await sleep(LOAD_RETRY_MS);
        }
      }

      throw lastError;
    } catch (e) {
      if (initial) {
        setError(e?.response?.data?.error || e?.message || 'Failed to load monitoring status');
      }
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ initial: true });
    const timer = setInterval(() => load({ initial: false }), refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const services = payload?.services?.services || [];
  const alerts = payload?.alerts;
  const activeIncidents = alerts?.activeIncidents || [];

  const visibleServices = useMemo(
    () => services.filter((svc) => PIPELINE_SERVICE_IDS.includes(svc.id)),
    [services]
  );

  return (
    <DashboardPanel
      title="Pipeline services"
      subtitle="Per-service status from the last monitoring window."
      icon={HubOutlinedIcon}
      iconTone="pipeline"
      chips={
        <>
          {alerts?.slackConfigured ? (
            <Chip size="small" label="Slack alerts on" color="success" variant="outlined" />
          ) : (
            <Chip size="small" label="Slack not configured" variant="outlined" />
          )}
          {alerts?.firstResponderMention ? (
            <Chip size="small" label={`First responder: ${alerts.firstResponderMention}`} variant="outlined" />
          ) : null}
          {activeIncidents.length > 0 ? (
            <Chip size="small" label={`${activeIncidents.length} open alert(s)`} color="error" />
          ) : null}
        </>
      }
    >
      {error && !loading ? (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {loading && !payload ? (
        <Stack direction="row" spacing={1} alignItems="center" py={1}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Loading pipeline metrics…
          </Typography>
        </Stack>
      ) : null}

      {!loading && visibleServices.length > 0 ? (
        <Box sx={{ overflowX: 'auto', mx: -0.5 }}>
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
                <TableRow key={svc.id} hover>
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

      {!loading && visibleServices.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No pipeline traffic in the last 15 minutes.
        </Typography>
      ) : null}

      {activeIncidents.length > 0 ? (
        <Alert severity="warning" sx={{ mt: visibleServices.length ? 1.5 : 0 }}>
          Open alerts: {activeIncidents.map((i) => i.id).join(', ')}
        </Alert>
      ) : null}
    </DashboardPanel>
  );
}
