'use client';

import { useCallback, useEffect, useState } from 'react';

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
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import ReviewsRoundedIcon from '@mui/icons-material/ReviewsRounded';
import Rating from '@mui/material/Rating';

import DashboardPanel from '@/components/DashboardPanel';
import ExpandableTableSection from '@/components/ExpandableTableSection';
import { fetchUserFeedback } from '@/services/feedbackService';

const AUDIENCE_OPTIONS = {
  admin: {
    label: 'Users',
    description: 'Overall Everspeak experience ratings from event organizers.',
    emptyMessage: 'No user feedback yet. Prompts appear on the dashboard after completed events.',
    summaryWorkspaceLabel: 'By workspace',
    showLanguageBreakdown: false
  },
  participant: {
    label: 'Viewers',
    description: 'Translation quality ratings from people on the broadcast page.',
    emptyMessage: 'No viewer feedback yet. Prompts appear when an event ends.',
    summaryWorkspaceLabel: 'By workspace',
    showLanguageBreakdown: true
  }
};

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
            label={`${item.label} · ${item.averageRating ?? '—'}★ (${item.count})`}
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

  const audienceMeta = AUDIENCE_OPTIONS[audience] || AUDIENCE_OPTIONS.admin;

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
    setLoading(true);
    load();
    if (!refreshSec) return undefined;
    const timer = setInterval(load, refreshSec * 1000);
    return () => clearInterval(timer);
  }, [load, refreshSec]);

  const rows = payload?.items || [];
  const summaries = payload?.summaries || { byCustomer: [], byLanguage: [] };
  const showLanguage = audienceMeta.showLanguageBreakdown;
  const hasSummaries =
    summaries.byCustomer.length > 0 || (showLanguage && summaries.byLanguage.length > 0);

  const handleAudienceChange = (_event, nextAudience) => {
    if (!nextAudience) return;
    setAudience(nextAudience);
    setTableExpanded(false);
  };

  return (
    <DashboardPanel
      title="Feedback"
      subtitle={audienceMeta.description}
      icon={ReviewsRoundedIcon}
      iconTone="feedback"
      actions={
        <ToggleButtonGroup
          size="small"
          exclusive
          value={audience}
          onChange={handleAudienceChange}
          aria-label="Feedback audience"
        >
          <ToggleButton value="admin" sx={{ textTransform: 'none', px: 1.75 }}>
            Users
          </ToggleButton>
          <ToggleButton value="participant" sx={{ textTransform: 'none', px: 1.75 }}>
            Viewers
          </ToggleButton>
        </ToggleButtonGroup>
      }
      chips={
        payload && !loading ? (
          <>
            <Chip size="small" label={`${payload.total} response${payload.total === 1 ? '' : 's'}`} variant="outlined" />
            {payload.averageRating != null ? (
              <Chip
                size="small"
                label={`${payload.averageRating}★ average`}
                color="primary"
                variant="outlined"
              />
            ) : null}
          </>
        ) : null
      }
      footer={refreshSec ? `Refreshes every ${refreshSec}s` : null}
      footerSlot={
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
                <TableCell>Submitted</TableCell>
                <TableCell>Workspace</TableCell>
                <TableCell>Event</TableCell>
                {showLanguage ? <TableCell>Language</TableCell> : null}
                <TableCell>Rating</TableCell>
                <TableCell>Comment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatWhen(row.created_at)}</TableCell>
                  <TableCell>{row.workspace_name || row.workspace_id || '—'}</TableCell>
                  <TableCell>{row.event_title || row.event_id || '—'}</TableCell>
                  {showLanguage ? <TableCell>{row.language_code || '—'}</TableCell> : null}
                  <TableCell>
                    <Rating value={row.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280, whiteSpace: 'normal' }}>{row.comment || '—'}</TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={showLanguage ? 6 : 5}>
                    <Typography variant="body2" color="text.secondary">
                      {audienceMeta.emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </ExpandableTableSection>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && hasSummaries ? (
        <Stack
          spacing={1.5}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <SummaryChips title={audienceMeta.summaryWorkspaceLabel} items={summaries.byCustomer} />
          {showLanguage ? <SummaryChips title="By language" items={summaries.byLanguage} /> : null}
        </Stack>
      ) : null}

      {!loading && !error && !rows.length ? (
        <Alert severity="info">{audienceMeta.emptyMessage}</Alert>
      ) : null}
    </DashboardPanel>
  );
}
