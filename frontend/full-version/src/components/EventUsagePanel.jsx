'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Link,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ExpandableTableSection from '@/components/ExpandableTableSection';
import DashboardPanel from '@/components/DashboardPanel';
import { downloadEventUsageCsv, fetchEventUsage } from '@/services/eventUsageService';

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatLangs(source = [], target = []) {
  const parts = [];
  if (source.length) parts.push(`SRC: ${source.join(', ')}`);
  if (target.length) parts.push(`TGT: ${target.join(', ')}`);
  return parts.join(' · ') || '—';
}

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '—';
  }
}

function broadcastUrl(eventId) {
  const base = (process.env.NEXT_PUBLIC_API_HOST || process.env.NEXT_PUBLIC_METRICS_API || 'https://app.everspeak.ai').replace(
    /\/$/,
    ''
  );
  return `${base}/broadcast/${eventId}`;
}

const RANGE_OPTIONS = [
  { key: '24h', label: 'Last 24 hours', rollingHours: 24 },
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '180d', label: 'Last 180 days', days: 180 }
];

function localIsoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildUsageQuery(rangeKey) {
  const option = RANGE_OPTIONS.find((opt) => opt.key === rangeKey) || RANGE_OPTIONS[2];

  if (option.rollingHours) {
    return { rollingHours: option.rollingHours, limit: 100 };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (option.days - 1));

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate: localIsoDate(start),
    endDate: localIsoDate(end),
    limit: 100
  };
}

function formatPeriodLabel(payload) {
  if (!payload) return '—';
  if (payload.rollingHours) {
    return `Last ${payload.rollingHours} hours · by last activity`;
  }
  if (payload.startDate && payload.endDate) {
    return `${payload.startDate} → ${payload.endDate} · by last activity`;
  }
  return '—';
}

export default function EventUsagePanel({ refreshSec = 60, defaultRangeKey = '30d' }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [rangeKey, setRangeKey] = useState(defaultRangeKey);
  const [tableExpanded, setTableExpanded] = useState(false);

  const query = useMemo(() => buildUsageQuery(rangeKey), [rangeKey]);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchEventUsage(query);
      setPayload(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load event usage');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    setLoading(true);
    load();
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError('');
      const blob = await downloadEventUsageCsv({ ...query, limit: 500 });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `event-usage-${payload?.startDate || 'export'}-${payload?.endDate || localIsoDate()}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'CSV export failed');
    } finally {
      setExporting(false);
    }
  };

  const events = payload?.events || [];
  const periodLabel = formatPeriodLabel(payload);

  return (
    <DashboardPanel
      title="Event usage & export"
      subtitle={payload?.unitDefinition || 'Units from billing ledger on events (chargeable time only).'}
      icon={TableChartOutlinedIcon}
      iconTone="primary"
      actions={
        <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
          <Select size="small" value={rangeKey} onChange={(e) => setRangeKey(e.target.value)} sx={{ minWidth: 150 }}>
            {RANGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.key} value={opt.key}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          <Button
            size="small"
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={14} /> : <DownloadRoundedIcon />}
            onClick={handleExport}
            disabled={exporting || loading}
          >
            Export CSV
          </Button>
        </Stack>
      }
      chips={
        !loading && events.length > 0 ? (
          <>
            <Chip size="small" label={`${payload?.totalUnits ?? 0} units total`} color="primary" variant="outlined" />
            <Chip size="small" label={`${events.length} event${events.length === 1 ? '' : 's'}`} variant="outlined" />
          </>
        ) : null
      }
      footer={periodLabel}
      footerSlot={
        !loading && events.length > 0 ? (
          <ExpandableTableSection
            count={events.length}
            itemLabel="events"
            expanded={tableExpanded}
            onToggle={() => setTableExpanded((v) => !v)}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Last active</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell align="right">Units</TableCell>
                  <TableCell>Languages</TableCell>
                  <TableCell align="right">Listeners</TableCell>
                  <TableCell>Customer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Link href={broadcastUrl(event.id)} target="_blank" rel="noopener noreferrer" underline="hover">
                          {event.title}
                        </Link>
                        <Typography variant="caption" color="text.secondary">
                          {event.status}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{formatWhen(event.updatedAt || event.createdAt)}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{formatDuration(event.durationSeconds)}</Typography>
                        {event.bonusSecondsConsumed > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(event.chargeableSeconds)} chargeable
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {event.unitsConsumed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.unitsIsEstimated ? 'est.' : 'billed'} · ×{event.targetLanguageCount} lang
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 220 }}>
                        {formatLangs(event.sourceLanguages, event.targetLanguages)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {event.status === 'Live' && event.currentListeners != null ? (
                        <Stack spacing={0.25} alignItems="flex-end">
                          <Typography variant="body2">{event.currentListeners} now</Typography>
                          {event.peakListeners > event.currentListeners && (
                            <Typography variant="caption" color="text.secondary">
                              peak {event.peakListeners}
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2">{event.peakListeners > 0 ? event.peakListeners : '—'}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{event.customerEmail || '—'}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ExpandableTableSection>
        ) : null
      }
    >
      {error ? (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {loading && !payload ? (
        <Stack alignItems="center" py={2}>
          <CircularProgress size={28} />
        </Stack>
      ) : events.length === 0 && !loading ? (
        <Typography variant="body2" color="text.secondary">
          No events in this period.
        </Typography>
      ) : null}
    </DashboardPanel>
  );
}
