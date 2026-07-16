'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import ReviewsRoundedIcon from '@mui/icons-material/ReviewsRounded';
import Rating from '@mui/material/Rating';

import ExpandableTableSection from '@/components/ExpandableTableSection';
import { fetchUserFeedback } from '@/services/feedbackService';

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '—';
  }
}

function SummaryChips({ title, items = [] }) {
  if (!items.length) return null;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {items.slice(0, 8).map((item) => (
          <Chip
            key={item.key}
            size="small"
            label={`${item.label}: ${item.averageRating ?? '—'}★ (${item.count})`}
            variant="outlined"
          />
        ))}
      </Stack>
    </Box>
  );
}

export default function UserFeedbackPanel({ refreshSec = 120, defaultAudience = 'admin' }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audience, setAudience] = useState(defaultAudience);
  const [tableExpanded, setTableExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchUserFeedback({ audience, limit: 100 });
      setPayload(data);
    } catch (loadError) {
      setPayload(null);
      setError(loadError?.response?.data?.error || loadError?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    load();
    if (!refreshSec) return undefined;
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const rows = payload?.items || [];
  const summaries = payload?.summaries || { byCustomer: [], byLanguage: [] };

  const headline = useMemo(() => {
    if (!payload) return 'User feedback';
    const avg = payload.averageRating != null ? `${payload.averageRating}★ avg` : 'No ratings yet';
    return `User feedback · ${payload.total} responses · ${avg}`;
  }, [payload]);

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack spacing={2} sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <ReviewsRoundedIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {headline}
            </Typography>
          </Stack>
          <Select size="small" value={audience} onChange={(event) => setAudience(event.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="admin">Admin / customer</MenuItem>
            <MenuItem value="participant">Participant</MenuItem>
          </Select>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error ? (
          <Stack spacing={1.5}>
            <SummaryChips title="By customer" items={summaries.byCustomer} />
            <SummaryChips title="By language" items={summaries.byLanguage} />
          </Stack>
        ) : null}
      </Stack>

      <ExpandableTableSection
        count={rows.length}
        itemLabel="responses"
        expanded={tableExpanded}
        onToggle={() => setTableExpanded((value) => !value)}
        disabled={loading || Boolean(error)}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Comment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{formatWhen(row.created_at)}</TableCell>
                <TableCell>{row.workspace_name || row.workspace_id || '—'}</TableCell>
                <TableCell>{row.event_title || row.event_id || '—'}</TableCell>
                <TableCell>{row.language_code || '—'}</TableCell>
                <TableCell>
                  <Rating value={row.rating} readOnly size="small" />
                </TableCell>
                <TableCell sx={{ maxWidth: 280, whiteSpace: 'normal' }}>{row.comment || '—'}</TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    No feedback collected yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </ExpandableTableSection>
    </Paper>
  );
}
