/**
 * Pure expense field normalization (no DB / network).
 */

const CATEGORIES = new Set(['asr', 'translation', 'tts', 'llm', 'other']);

function isoDay(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function normalizeExpenseCategory(raw) {
  const key = String(raw || 'other')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
  if (CATEGORIES.has(key)) return key;
  if (/(asr|stt|speech|deepgram|eleven)/.test(key)) return 'asr';
  if (/(deepl|translat|mt)/.test(key)) return 'translation';
  if (/(tts|speech_synth|voice)/.test(key)) return 'tts';
  if (/(llm|openai|gemini|gpt|chat|anthropic)/.test(key)) return 'llm';
  return 'other';
}

export function normalizeExpenseVendor(raw) {
  const vendor = String(raw || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_');
  return vendor || 'unknown';
}

export function normalizeExpenseInput(body = {}) {
  const amountEur = Number(body.amount_eur ?? body.amountEur);
  if (!Number.isFinite(amountEur) || amountEur < 0) {
    throw new Error('amount_eur must be a non-negative number');
  }

  const day = isoDay(body.day || body.date);
  const periodStart = isoDay(body.period_start || body.periodStart || body.start);
  const periodEnd = isoDay(body.period_end || body.periodEnd || body.end) || periodStart;

  if (!day && !(periodStart && periodEnd)) {
    throw new Error('Provide day or period_start + period_end');
  }
  if (periodStart && periodEnd && periodStart > periodEnd) {
    throw new Error('period_start must be on or before period_end');
  }

  const status = String(body.status || 'draft').toLowerCase();
  if (!['draft', 'confirmed', 'rejected'].includes(status)) {
    throw new Error('Invalid status');
  }

  const amountOriginal = body.amount_original ?? body.amountOriginal;
  return {
    vendor: normalizeExpenseVendor(body.vendor || body.provider),
    category: normalizeExpenseCategory(body.category || body.cost_category),
    amount_eur: amountEur,
    currency:
      String(body.currency || 'EUR')
        .trim()
        .toUpperCase() || 'EUR',
    amount_original: amountOriginal == null || amountOriginal === '' ? null : Number(amountOriginal),
    day: day || null,
    period_start: day ? null : periodStart,
    period_end: day ? null : periodEnd,
    source: String(body.source || 'invoice_upload').trim() || 'invoice_upload',
    note: String(body.note || body.description || '').trim() || null,
    invoice_filename: body.invoice_filename || body.invoiceFilename || null,
    invoice_storage_path: body.invoice_storage_path || body.invoiceStoragePath || null,
    invoice_url: body.invoice_url || body.invoiceUrl || null,
    extracted_json: body.extracted_json || body.extractedJson || null,
    status,
    created_by: body.created_by || body.createdBy || null,
    created_by_email: body.created_by_email || body.createdByEmail || null,
    confirmed_at: status === 'confirmed' ? body.confirmed_at || new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };
}
