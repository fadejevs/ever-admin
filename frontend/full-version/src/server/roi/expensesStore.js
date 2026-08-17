/**
 * Persist / query confirmed + draft vendor invoices for ROI (EVE-138).
 * Admin APIs use the service-role Supabase client.
 */

import { supabase } from '@/utils/supabase/server';
import { expandVendorExpenseEntry } from '@/server/roi/vendorCostLedger';
import { normalizeExpenseInput } from '@/server/roi/expensesNormalize';

export { normalizeExpenseInput } from '@/server/roi/expensesNormalize';

const TABLE = 'roi_vendor_expenses';
const BUCKET = 'roi-invoices';

function monthBounds(month) {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return null;
  const [y, m] = String(month).split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = new Date(Date.UTC(y, m, 0));
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

function expenseOverlapsRange(row, startDay, endDay) {
  if (!startDay || !endDay) return true;
  if (row.day) return row.day >= startDay && row.day <= endDay;
  const ps = row.period_start;
  const pe = row.period_end || row.period_start;
  if (!ps || !pe) return false;
  return ps <= endDay && pe >= startDay;
}

function toLedgerEntry(row) {
  return {
    vendor: row.vendor,
    category: row.category,
    amount_eur: Number(row.amount_eur),
    day: row.day || undefined,
    period_start: row.period_start || undefined,
    period_end: row.period_end || undefined,
    source: row.source || 'invoice_upload',
    note: row.note || ''
  };
}

function monthKeyFromExpense(row) {
  const day = row.day || row.period_start || row.period_end;
  return day ? String(day).slice(0, 7) : 'unknown';
}

export async function listVendorExpenses({ month, status, startDay, endDay } = {}) {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.limit(500);
  if (error) throw new Error(error.message || 'Failed to list expenses');

  const allRows = data || [];
  const bounds = month ? monthBounds(month) : null;
  const rangeStart = bounds?.start || startDay;
  const rangeEnd = bounds?.end || endDay;

  const expenses =
    rangeStart && rangeEnd ? allRows.filter((row) => expenseOverlapsRange(row, rangeStart, rangeEnd)) : allRows;

  const byMonth = {};
  for (const row of allRows) {
    if (row.status !== 'confirmed') continue;
    const key = monthKeyFromExpense(row);
    if (!byMonth[key]) byMonth[key] = { month: key, total_eur: 0, count: 0, by_vendor: {}, by_category: {} };
    const bucket = byMonth[key];
    const amount = Number(row.amount_eur || 0);
    bucket.total_eur += amount;
    bucket.count += 1;
    bucket.by_vendor[row.vendor] = (bucket.by_vendor[row.vendor] || 0) + amount;
    bucket.by_category[row.category] = (bucket.by_category[row.category] || 0) + amount;
  }

  const monthSummaries = Object.values(byMonth).sort((a, b) => String(b.month).localeCompare(String(a.month)));
  const confirmedTotal = expenses
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + Number(r.amount_eur || 0), 0);

  return {
    expenses,
    month_summaries: monthSummaries,
    confirmed_total_eur: confirmedTotal,
    filters: { month: month || null, status: status || null, startDay: rangeStart || null, endDay: rangeEnd || null }
  };
}

export async function fetchConfirmedExpenseLedger({ startDay, endDay } = {}) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('status', 'confirmed').limit(1000);
  if (error) throw new Error(error.message || 'Failed to load confirmed expenses');

  let rows = data || [];
  if (startDay && endDay) {
    rows = rows.filter((row) => expenseOverlapsRange(row, startDay, endDay));
  }
  return rows.map(toLedgerEntry);
}

export async function createVendorExpense(body, actor = {}) {
  const row = normalizeExpenseInput({
    ...body,
    created_by: actor.userId || body.created_by,
    created_by_email: actor.email || body.created_by_email
  });

  const { data, error } = await supabase.from(TABLE).insert(row).select('*').single();
  if (error) throw new Error(error.message || 'Failed to create expense');
  return data;
}

export async function updateVendorExpense(id, body) {
  if (!id) throw new Error('Missing expense id');
  const patch = normalizeExpenseInput({
    ...body,
    status: body.status || 'draft'
  });
  if (body.created_by == null && body.createdBy == null) delete patch.created_by;
  if (body.created_by_email == null && body.createdByEmail == null) delete patch.created_by_email;

  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).select('*').single();
  if (error) throw new Error(error.message || 'Failed to update expense');
  return data;
}

export async function deleteVendorExpense(id) {
  if (!id) throw new Error('Missing expense id');
  const { data: existing } = await supabase.from(TABLE).select('invoice_storage_path').eq('id', id).maybeSingle();
  if (existing?.invoice_storage_path) {
    await supabase.storage.from(BUCKET).remove([existing.invoice_storage_path]);
  }
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete expense');
  return { ok: true };
}

export async function uploadInvoiceFile({ buffer, filename, contentType, userId }) {
  const safeName = String(filename || 'invoice.pdf')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 120);
  const folder = userId || 'admin';
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false
  });
  if (error) throw new Error(error.message || 'Failed to upload invoice');

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return {
    invoice_storage_path: path,
    invoice_filename: safeName,
    invoice_url: signed?.signedUrl || null
  };
}

export function previewLedgerDays(entry) {
  return expandVendorExpenseEntry(toLedgerEntry(entry));
}
