'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import DashboardPanel from '@/components/DashboardPanel';
import { createRoiExpense, deleteRoiExpense, extractRoiInvoice, fetchExpenses, updateRoiExpense } from '@/services/metricsService';

const CATEGORIES = [
  { value: 'asr', label: 'ASR' },
  { value: 'translation', label: 'Translation' },
  { value: 'tts', label: 'TTS' },
  { value: 'llm', label: 'LLM' },
  { value: 'other', label: 'Other' }
];

const EMPTY_DRAFT = {
  vendor: '',
  category: 'other',
  amount_eur: '',
  currency: 'EUR',
  amount_original: '',
  day: '',
  period_start: '',
  period_end: '',
  note: '',
  status: 'draft',
  source: 'manual',
  invoice_filename: null,
  invoice_storage_path: null,
  invoice_url: null,
  extracted_json: null
};

function formatEur(value) {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(amount);
  } catch {
    return `€${amount.toFixed(2)}`;
  }
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthOptions(summaries = []) {
  const set = new Set([currentMonth(), ...summaries.map((s) => s.month).filter(Boolean)]);
  const now = new Date();
  for (let i = 1; i <= 5; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    set.add(d.toISOString().slice(0, 7));
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

function toPayload(draft, status) {
  const amount = Number(draft.amount_eur);
  const payload = {
    vendor: draft.vendor,
    category: draft.category,
    amount_eur: amount,
    currency: draft.currency || 'EUR',
    amount_original: draft.amount_original === '' || draft.amount_original == null ? null : Number(draft.amount_original),
    note: draft.note || '',
    source: draft.source || 'manual',
    status,
    invoice_filename: draft.invoice_filename || null,
    invoice_storage_path: draft.invoice_storage_path || null,
    invoice_url: draft.invoice_url || null,
    extracted_json: draft.extracted_json || null
  };

  if (draft.day) {
    payload.day = draft.day;
  } else {
    payload.period_start = draft.period_start;
    payload.period_end = draft.period_end || draft.period_start;
  }
  return payload;
}

function validateDraft(draft) {
  if (!String(draft.vendor || '').trim()) return 'Vendor is required';
  if (!Number.isFinite(Number(draft.amount_eur)) || Number(draft.amount_eur) < 0) return 'Amount (EUR) is required';
  if (!draft.day && !(draft.period_start && draft.period_end)) {
    return 'Set an invoice day or a billing period';
  }
  return '';
}

export default function ExpensesPanel() {
  const [month, setMonth] = useState(currentMonth);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [extractNote, setExtractNote] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchExpenses({ month });
      setPayload(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const months = useMemo(() => monthOptions(payload?.month_summaries || []), [payload?.month_summaries]);
  const expenses = payload?.expenses || [];
  const monthTotal = useMemo(
    () => expenses.filter((e) => e.status === 'confirmed').reduce((sum, e) => sum + Number(e.amount_eur || 0), 0),
    [expenses]
  );

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setExtractNote('');
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setError('');
    setExtractNote('Analyzing invoice…');
    try {
      const result = await extractRoiInvoice(file);
      const d = result?.draft || {};
      setEditingId(null);
      setDraft({
        ...EMPTY_DRAFT,
        vendor: d.vendor || '',
        category: d.category || 'other',
        amount_eur: d.amount_eur ?? '',
        currency: d.currency || 'EUR',
        amount_original: d.amount_original ?? '',
        day: d.day || '',
        period_start: d.period_start || '',
        period_end: d.period_end || '',
        note: d.note || '',
        source: 'invoice_upload',
        status: 'draft',
        invoice_filename: d.invoice_filename || file.name,
        invoice_storage_path: d.invoice_storage_path || null,
        invoice_url: d.invoice_url || null,
        extracted_json: d.extracted_json || d
      });
      const warnings = Array.isArray(d.warnings) && d.warnings.length ? ` · ${d.warnings.join('; ')}` : '';
      setExtractNote(`Extracted (${result?.mode || 'ai'})${warnings}`);
    } catch (e) {
      setExtractNote('');
      setError(e?.response?.data?.error || e?.message || 'Invoice extract failed');
    } finally {
      setBusy(false);
    }
  };

  const save = async (status) => {
    const validation = validateDraft(draft);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = toPayload(draft, status);
      if (editingId) {
        await updateRoiExpense(editingId, body);
      } else {
        await createRoiExpense(body);
      }
      resetDraft();
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to save expense');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({
      vendor: row.vendor || '',
      category: row.category || 'other',
      amount_eur: row.amount_eur ?? '',
      currency: row.currency || 'EUR',
      amount_original: row.amount_original ?? '',
      day: row.day || '',
      period_start: row.period_start || '',
      period_end: row.period_end || '',
      note: row.note || '',
      status: row.status || 'draft',
      source: row.source || 'invoice_upload',
      invoice_filename: row.invoice_filename,
      invoice_storage_path: row.invoice_storage_path,
      invoice_url: row.invoice_url,
      extracted_json: row.extracted_json
    });
    setExtractNote(row.invoice_filename ? `Editing · ${row.invoice_filename}` : 'Editing entry');
  };

  const confirmRow = async (row) => {
    setBusy(true);
    setError('');
    try {
      await updateRoiExpense(row.id, {
        vendor: row.vendor,
        category: row.category,
        amount_eur: Number(row.amount_eur),
        currency: row.currency || 'EUR',
        amount_original: row.amount_original,
        day: row.day || null,
        period_start: row.period_start || null,
        period_end: row.period_end || null,
        note: row.note || '',
        source: row.source,
        invoice_filename: row.invoice_filename,
        invoice_storage_path: row.invoice_storage_path,
        invoice_url: row.invoice_url,
        extracted_json: row.extracted_json,
        status: 'confirmed'
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to confirm');
    } finally {
      setBusy(false);
    }
  };

  const removeRow = async (row) => {
    if (!window.confirm(`Delete ${row.vendor} ${formatEur(row.amount_eur)}?`)) return;
    setBusy(true);
    setError('');
    try {
      await deleteRoiExpense(row.id);
      if (editingId === row.id) resetDraft();
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardPanel
      title="Vendor expenses"
      subtitle="Upload provider invoices → AI extract → confirm into ROI month totals"
      icon={ReceiptLongOutlinedIcon}
      iconTone="pipeline"
      chips={
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
          <Chip size="small" color="primary" variant="outlined" label={`${month} confirmed ${formatEur(monthTotal)}`} />
          <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(e.target.value)} sx={{ minWidth: 130 }}>
            {months.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      }
      actions={
        <Button
          component="label"
          size="small"
          variant="contained"
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <CloudUploadOutlinedIcon />}
          disabled={busy}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Upload invoice
          <input hidden type="file" accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.webp,application/pdf,text/*,image/*" onChange={onFile} />
        </Button>
      }
    >
      <Stack spacing={2}>
        {error ? <Alert severity="warning">{error}</Alert> : null}
        {extractNote ? (
          <Typography variant="body2" color="text.secondary">
            {extractNote}
          </Typography>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }
          }}
        >
          <TextField
            size="small"
            label="Vendor"
            value={draft.vendor}
            onChange={(e) => setDraft((d) => ({ ...d, vendor: e.target.value }))}
            placeholder="deepl, openai, elevenlabs…"
          />
          <TextField
            select
            size="small"
            label="Category"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Amount (EUR)"
            type="number"
            value={draft.amount_eur}
            onChange={(e) => setDraft((d) => ({ ...d, amount_eur: e.target.value }))}
            inputProps={{ min: 0, step: '0.01' }}
          />
          <TextField
            size="small"
            label="Invoice day"
            type="date"
            value={draft.day}
            onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value, period_start: '', period_end: '' }))}
            InputLabelProps={{ shrink: true }}
            helperText="One-off charge"
          />
          <TextField
            size="small"
            label="Period start"
            type="date"
            value={draft.period_start}
            onChange={(e) => setDraft((d) => ({ ...d, period_start: e.target.value, day: '' }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="Period end"
            type="date"
            value={draft.period_end}
            onChange={(e) => setDraft((d) => ({ ...d, period_end: e.target.value, day: '' }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="Note"
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            sx={{ gridColumn: { md: '1 / -1' } }}
          />
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" disabled={busy} onClick={() => save('draft')} sx={{ textTransform: 'none' }}>
            {editingId ? 'Update draft' : 'Save draft'}
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={busy}
            onClick={() => save('confirmed')}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {editingId ? 'Update & confirm' : 'Confirm into ROI'}
          </Button>
          {(editingId || draft.vendor || draft.amount_eur !== '') && (
            <Button size="small" color="inherit" disabled={busy} onClick={resetDraft} sx={{ textTransform: 'none' }}>
              Clear
            </Button>
          )}
        </Stack>

        {loading && !payload ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : expenses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No expenses for {month} yet. Upload a PDF/CSV/screenshot of a provider invoice, review the AI fields, then confirm.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">EUR</TableCell>
                <TableCell>Coverage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.vendor}
                    </Typography>
                    {row.note ? (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {row.note}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="right">{formatEur(row.amount_eur)}</TableCell>
                  <TableCell>
                    <Typography variant="caption">{row.day || `${row.period_start || '—'} → ${row.period_end || '—'}`}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.status}
                      color={row.status === 'confirmed' ? 'success' : row.status === 'draft' ? 'default' : 'warning'}
                      variant={row.status === 'confirmed' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button size="small" onClick={() => startEdit(row)} sx={{ textTransform: 'none', minWidth: 0 }}>
                        Edit
                      </Button>
                      {row.status !== 'confirmed' ? (
                        <Button size="small" onClick={() => confirmRow(row)} disabled={busy} sx={{ textTransform: 'none', minWidth: 0 }}>
                          Confirm
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeRow(row)}
                        disabled={busy}
                        sx={{ textTransform: 'none', minWidth: 0 }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {(payload?.month_summaries || []).length > 0 ? (
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.75 }}>
              Confirmed month-to-month
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {payload.month_summaries.map((m) => (
                <Chip
                  key={m.month}
                  size="small"
                  variant={m.month === month ? 'filled' : 'outlined'}
                  color={m.month === month ? 'primary' : 'default'}
                  label={`${m.month}: ${formatEur(m.total_eur)} (${m.count})`}
                  onClick={() => setMonth(m.month)}
                />
              ))}
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </DashboardPanel>
  );
}
