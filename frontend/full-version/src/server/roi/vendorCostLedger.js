/**
 * Pure vendor expense ledger helpers (no network / no Next aliases).
 */

const CATEGORY_KEYS = new Set(['asr', 'translation', 'tts', 'llm', 'other']);

function isoDay(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function eachDayInclusive(startDay, endDay) {
  const out = [];
  if (!startDay || !endDay || startDay > endDay) return out;
  const cursor = new Date(`${startDay}T00:00:00.000Z`);
  const end = new Date(`${endDay}T00:00:00.000Z`);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function normalizeCategory(raw) {
  const key = String(raw || 'other')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
  if (CATEGORY_KEYS.has(key)) return key;
  if (/(asr|stt|speech|eleven|deepgram)/.test(key)) return 'asr';
  if (/(deepl|translat|mt)/.test(key)) return 'translation';
  if (/(tts|speech_synth|voice)/.test(key)) return 'tts';
  if (/(llm|openai|gemini|gpt|chat)/.test(key)) return 'llm';
  return 'other';
}

function normalizeVendor(raw) {
  const vendor = String(raw || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_');
  return vendor || 'unknown';
}

function readAmountEur(entry) {
  const direct = Number(entry?.amount_eur ?? entry?.amountEur ?? entry?.eur);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const cents = Number(entry?.amount_cents ?? entry?.amountCents);
  if (Number.isFinite(cents) && cents >= 0) return cents / 100;
  const usd = Number(entry?.amount_usd ?? entry?.amountUsd ?? entry?.usd);
  const rate = Number(entry?.usd_to_eur ?? entry?.usdToEur ?? 0.92);
  if (Number.isFinite(usd) && usd >= 0 && Number.isFinite(rate) && rate > 0) return usd * rate;
  return 0;
}

/**
 * Expand a ledger entry into per-day EUR amounts.
 * Supports:
 *  - { day, amount_eur, vendor, category }
 *  - { period_start, period_end, amount_eur, vendor, category } (spread evenly)
 */
export function expandVendorExpenseEntry(entry) {
  const amountEur = readAmountEur(entry);
  if (!(amountEur > 0)) return [];

  const vendor = normalizeVendor(entry?.vendor ?? entry?.provider);
  const category = normalizeCategory(entry?.category ?? entry?.cost_category ?? vendor);
  const source = String(entry?.source || 'invoice').trim() || 'invoice';
  const note = String(entry?.note || entry?.description || '').trim();

  const singleDay = isoDay(entry?.day || entry?.date);
  if (singleDay) {
    return [{ day: singleDay, vendor, category, amountEur, source, note }];
  }

  const start = isoDay(entry?.period_start || entry?.periodStart || entry?.start);
  const end = isoDay(entry?.period_end || entry?.periodEnd || entry?.end) || start;
  const days = eachDayInclusive(start, end);
  if (!days.length) return [];

  const perDay = amountEur / days.length;
  return days.map((day) => ({ day, vendor, category, amountEur: perDay, source, note }));
}

/**
 * @param {unknown[]} ledger
 * @returns {Map<string, { totalEur: number, byVendor: Record<string, number>, byCategory: Record<string, number>, entries: object[] }>}
 */
export function buildDailyVendorCostMap(ledger = []) {
  /** @type {Map<string, { totalEur: number, byVendor: Record<string, number>, byCategory: Record<string, number>, entries: object[] }>} */
  const byDay = new Map();

  for (const raw of Array.isArray(ledger) ? ledger : []) {
    for (const item of expandVendorExpenseEntry(raw)) {
      const bucket = byDay.get(item.day) || {
        totalEur: 0,
        byVendor: {},
        byCategory: {},
        entries: []
      };
      bucket.totalEur += item.amountEur;
      bucket.byVendor[item.vendor] = (bucket.byVendor[item.vendor] || 0) + item.amountEur;
      bucket.byCategory[item.category] = (bucket.byCategory[item.category] || 0) + item.amountEur;
      bucket.entries.push(item);
      byDay.set(item.day, bucket);
    }
  }

  return byDay;
}

/**
 * Allocate a day's vendor costs across event rows by runtime weight.
 */
export function allocateVendorCostsToRows(dayRows, dayBucket) {
  if (!Array.isArray(dayRows) || !dayRows.length || !dayBucket?.totalEur) {
    return { allocated: 0, vendors: {} };
  }

  const totalRuntime = dayRows.reduce((sum, row) => sum + Number(row.runtime_seconds || 0), 0);
  const byCategory = dayBucket.byCategory || {};
  const asrPool = Number(byCategory.asr || 0);
  const translationPool = Number(byCategory.translation || 0);
  const ttsPool = Number(byCategory.tts || 0);
  const llmPool = Number(byCategory.llm || 0);
  const otherPool = Number(byCategory.other || 0);
  const categorized = asrPool + translationPool + ttsPool + llmPool + otherPool;
  const dayTotal = Number(dayBucket.totalEur || 0);
  const uncategorized = Math.max(0, dayTotal - categorized);
  const replaceAll = categorized <= 0 && uncategorized > 0;
  const openAiBlendTts = Number(dayBucket.byVendor?.openai || 0) > 0 && !(ttsPool > 0);

  for (const row of dayRows) {
    const weight = totalRuntime > 0 ? Number(row.runtime_seconds || 0) / totalRuntime : 1 / dayRows.length;
    const allocated = dayTotal * weight;

    if (replaceAll) {
      row.api_cost_asr = 0;
      row.api_cost_translation = 0;
      row.api_cost_tts = 0;
      row.api_cost_llm = 0;
      row.api_cost_total = allocated;
      row.vendor_actual_other = allocated;
    } else {
      if (asrPool > 0) row.api_cost_asr = asrPool * weight;
      if (translationPool > 0) row.api_cost_translation = translationPool * weight;
      if (ttsPool > 0) row.api_cost_tts = ttsPool * weight;
      if (llmPool > 0) {
        row.api_cost_llm = llmPool * weight;
        if (openAiBlendTts) row.api_cost_tts = 0;
      }
      const otherAllocated = (otherPool + uncategorized) * weight;
      row.vendor_actual_other = otherAllocated;
      row.api_cost_total =
        Number(row.api_cost_asr || 0) +
        Number(row.api_cost_translation || 0) +
        Number(row.api_cost_tts || 0) +
        Number(row.api_cost_llm || 0) +
        otherAllocated;
    }

    row.vendor_actual_allocated = allocated;
    row.vendor_cost_by_vendor = Object.fromEntries(
      Object.entries(dayBucket.byVendor || {}).map(([vendor, amount]) => [vendor, Number(amount || 0) * weight])
    );
    if (row.vendor_cost_by_vendor.openai) {
      row.openai_actual_allocated = row.vendor_cost_by_vendor.openai;
    }

    const vendors = Object.keys(dayBucket.byVendor || {});
    row.cost_source =
      vendors.length === 1 && vendors[0] === 'openai'
        ? 'openai_actual_blended'
        : vendors.includes('openai')
          ? 'vendor_actual_with_openai'
          : 'vendor_actual';
  }

  return {
    allocated: dayTotal,
    vendors: { ...(dayBucket.byVendor || {}) }
  };
}
