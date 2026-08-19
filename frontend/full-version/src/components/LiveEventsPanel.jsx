'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
      day: 'numeric'
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
  const src = source.filter(Boolean).join(', ');
  const tgt = target.filter(Boolean).join(', ');
  if (src && tgt) return `${src} → ${tgt}`;
  return src || tgt || '—';
}

function broadcastUrl(eventId) {
  const base = (process.env.NEXT_PUBLIC_API_HOST || process.env.NEXT_PUBLIC_METRICS_API || 'https://app.everspeak.ai').replace(
    /\/$/,
    ''
  );
  return `${base}/broadcast/${eventId}`;
}

function SideList({ title, empty, children }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50'
      }}
    >
      <Typography
        variant="caption"
        sx={{ display: 'block', mb: 1, fontWeight: 700, letterSpacing: '0.02em', color: 'text.secondary', textTransform: 'uppercase' }}
      >
        {title}
      </Typography>
      {children || (
        <Typography variant="body2" color="text.secondary">
          {empty}
        </Typography>
      )}
    </Box>
  );
}

function formatPeakListeners(count) {
  const peak = Math.max(0, Number(count || 0));
  if (!peak) return '—';
  return `${peak} peak`;
}

function CompactRow({ title, meta, right }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="space-between"
      alignItems="baseline"
      sx={{ py: 0.65, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0, pb: 0 } }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {title}
        </Typography>
        {meta ? (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {meta}
          </Typography>
        ) : null}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        {right}
      </Typography>
    </Stack>
  );
}

const RECENT_PREVIEW_COUNT = 3;

export default function LiveEventsPanel({ refreshSec = 10 }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentExpanded, setRecentExpanded] = useState(false);

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
  const visibleRecentEvents = recentExpanded ? recentEvents : recentEvents.slice(0, RECENT_PREVIEW_COUNT);
  const hiddenRecentCount = Math.max(0, recentEvents.length - RECENT_PREVIEW_COUNT);
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
      title="Live now"
      subtitle="Active broadcasts — jump to the room or scan what’s next."
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
          {upcomingEvents.length > 0 ? (
            <Chip size="small" label={`${upcomingEvents.length} upcoming`} variant="outlined" />
          ) : null}
        </>
      }
      footer={`Updated ${updatedLabel} · every ${refreshSec}s`}
    >
      {loading && !payload ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">Loading…</Typography>
        </Stack>
      ) : null}

      {error && !payload ? <Alert severity="warning">{error}</Alert> : null}

      {!loading && !error && events.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {payload?.staleLiveCount
            ? `Nothing connected right now (${payload.staleLiveCount} stuck as Live in DB).`
            : 'No events are live right now.'}
        </Alert>
      ) : null}

      {events.length > 0 ? (
        <Box sx={{ overflowX: 'auto', mx: -0.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Workspace</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Languages</TableCell>
                <TableCell align="right">Listeners</TableCell>
                <TableCell>Live for</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: { md: 'none' } }}>
                      {event.workspaceName || event.customerEmail || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2">{event.workspaceName || '—'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {event.customerEmail || event.workspaceId || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {formatLangs(event.sourceLanguages, event.targetLanguages)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.viewerCount ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDuration(event.liveDurationMs)}</TableCell>
                  <TableCell align="right">
                    <Link href={broadcastUrl(event.id)} target="_blank" rel="noopener noreferrer" underline="hover">
                      Open
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
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }
          }}
        >
          <SideList title={`Upcoming${upcomingEvents.length ? ` · ${upcomingEvents.length}` : ''}`} empty="Nothing scheduled ahead.">
            {upcomingEvents.length > 0 ? (
              <Stack>
                {upcomingEvents.map((event) => (
                  <CompactRow
                    key={event.id}
                    title={event.title}
                    meta={event.workspaceName || event.customerEmail || event.workspaceId || '—'}
                    right={formatScheduledWhen(event.scheduledDate, event.scheduledTime)}
                  />
                ))}
              </Stack>
            ) : null}
          </SideList>

          <SideList title={`Recent${recentEvents.length ? ` · ${recentEvents.length}` : ''}`} empty="No recent runs.">
            {recentEvents.length > 0 ? (
              <Stack>
                {visibleRecentEvents.map((event) => (
                  <CompactRow
                    key={event.id}
                    title={event.title}
                    meta={`${event.workspaceName || event.customerEmail || event.workspaceId || '—'} · ${event.status} · ${formatWhen(event.ranAt)}`}
                    right={formatPeakListeners(event.peakListeners)}
                  />
                ))}
                {hiddenRecentCount > 0 ? (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => setRecentExpanded((open) => !open)}
                    sx={{ alignSelf: 'flex-start', mt: 0.5, px: 0, minWidth: 0, textTransform: 'none', fontWeight: 600 }}
                  >
                    {recentExpanded ? 'Show less' : `Show ${hiddenRecentCount} more`}
                  </Button>
                ) : null}
              </Stack>
            ) : null}
          </SideList>
        </Box>
      ) : null}
    </DashboardPanel>
  );
}
