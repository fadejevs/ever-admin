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
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { fetchLiveEvents } from '@/services/liveEventsService';

function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSec}s`;
}

function formatLangs(source = [], target = []) {
  const parts = [];
  if (source.length) parts.push(`SRC: ${source.join(', ')}`);
  if (target.length) parts.push(`TGT: ${target.join(', ')}`);
  return parts.join(' · ') || '—';
}

function broadcastUrl(eventId) {
  const base = (process.env.NEXT_PUBLIC_API_HOST || process.env.NEXT_PUBLIC_METRICS_API || 'https://app.everspeak.ai').replace(
    /\/$/,
    ''
  );
  return `${base}/broadcast/${eventId}`;
}

export default function LiveEventsPanel({ refreshSec = 10 }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchLiveEvents();
      setPayload(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load live events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const events = payload?.events || [];
  const totalListeners = payload?.totalListeners ?? events.reduce((sum, e) => sum + (e.viewerCount ?? 0), 0);
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FiberManualRecordIcon sx={{ color: '#F44336', fontSize: 14 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Live events now
          </Typography>
          <Chip size="small" label={`${events.length} live`} color={events.length ? 'error' : 'default'} variant={events.length ? 'filled' : 'outlined'} />
          {events.length > 0 ? (
            <Chip size="small" label={`${totalListeners} listeners`} color="primary" variant="outlined" />
          ) : null}
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Updated {updatedLabel} · refresh every {refreshSec}s · listeners = broadcast viewers (excludes host)
        </Typography>
      </Stack>

      {loading && !payload ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">Loading live events…</Typography>
        </Stack>
      ) : null}

      {error && !payload ? (
        <Alert severity="warning">{error}</Alert>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <Alert severity="info">
          {payload?.staleLiveCount
            ? `No events have active connections right now (${payload.staleLiveCount} stuck as Live in DB).`
            : 'No events are live right now.'}
        </Alert>
      ) : null}

      {events.length > 0 ? (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Customer / workspace</TableCell>
                <TableCell>Languages</TableCell>
                <TableCell align="right">Listeners</TableCell>
                <TableCell>Live for</TableCell>
                <TableCell align="right">Open</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {event.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{event.customerEmail || '—'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {event.workspaceName || event.workspaceId || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {formatLangs(event.sourceLanguages, event.targetLanguages)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.viewerCount ?? 0}
                    </Typography>
                    {(event.adminCount ?? 0) > 0 ? (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        +{event.adminCount} host
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{formatDuration(event.liveDurationMs)}</TableCell>
                  <TableCell align="right">
                    <Link href={broadcastUrl(event.id)} target="_blank" rel="noopener noreferrer" underline="hover">
                      Broadcast
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : null}

      {error && payload ? (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
          Last refresh failed: {error}
        </Typography>
      ) : null}
    </Paper>
  );
}
