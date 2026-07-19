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
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import { fetchLiveEvents } from '@/services/liveEventsService';
import DashboardPanel from '@/components/DashboardPanel';

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

function formatScheduledWhen(dateKey, time) {
  if (!dateKey) return '—';
  const [year, month, day] = String(dateKey).split('-').map(Number);
  if (!year || !month || !day) return dateKey;

  let dateLabel = dateKey;
  try {
    dateLabel = new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    // keep raw key
  }

  const timeLabel = String(time || '').trim();
  if (!timeLabel) return dateLabel;

  const match = timeLabel.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return `${dateLabel} · ${timeLabel}`;

  try {
    const formattedTime = new Date(year, month - 1, day, Number(match[1]), Number(match[2])).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
    return `${dateLabel} · ${formattedTime}`;
  } catch {
    return `${dateLabel} · ${timeLabel}`;
  }
}

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
  const recentEvents = payload?.recentEvents || [];
  const upcomingEvents = payload?.upcomingEvents || [];
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
    <DashboardPanel
      title="Live events now"
      subtitle="Active broadcasts, upcoming scheduled dates, and recent runs."
      icon={SensorsRoundedIcon}
      iconTone="live"
      accent={events.length ? 'error' : null}
      chips={
        <>
          <Chip
            size="small"
            label={`${events.length} live`}
            color={events.length ? 'error' : 'default'}
            variant={events.length ? 'filled' : 'outlined'}
          />
          {events.length > 0 ? (
            <Chip size="small" label={`${totalListeners} listeners`} color="primary" variant="outlined" />
          ) : null}
        </>
      }
      footer={`Updated ${updatedLabel} · refresh every ${refreshSec}s · listeners = broadcast viewers (excludes host)`}
    >
      {loading && !payload ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">Loading live events…</Typography>
        </Stack>
      ) : null}

      {error && !payload ? <Alert severity="warning">{error}</Alert> : null}

      {!loading && !error && events.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {payload?.staleLiveCount
            ? `No events have active connections right now (${payload.staleLiveCount} stuck as Live in DB).`
            : 'No events are live right now.'}
        </Alert>
      ) : null}

      {events.length > 0 ? (
        <Box sx={{ overflowX: 'auto', mx: -0.5 }}>
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

      {payload ? (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Upcoming scheduled{upcomingEvents.length ? ` · ${upcomingEvents.length}` : ''}
          </Typography>
          {upcomingEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No events scheduled for a future date.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {upcomingEvents.map((event) => (
                <Stack
                  key={event.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 0.25, sm: 1 }}
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                  sx={{
                    py: 0.75,
                    px: 1,
                    borderRadius: 1.5,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {event.workspaceName || event.customerEmail || event.workspaceId || '—'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {formatScheduledWhen(event.scheduledDate, event.scheduledTime)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      ) : null}

      {recentEvents.length > 0 ? (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Last {recentEvents.length} event{recentEvents.length === 1 ? '' : 's'} run
          </Typography>
          <Stack spacing={1}>
            {recentEvents.map((event) => (
              <Stack
                key={event.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.25, sm: 1 }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                sx={{
                  py: 0.75,
                  px: 1,
                  borderRadius: 1.5,
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {event.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {event.workspaceName || event.customerEmail || event.workspaceId || '—'} · {event.status}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {formatWhen(event.ranAt)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}
    </DashboardPanel>
  );
}
