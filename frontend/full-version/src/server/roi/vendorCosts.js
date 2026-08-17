/**
 * Normalized vendor invoice / expense ingest for ROI.
 *
 * Sources:
 *  1) Confirmed DB invoices — roi_vendor_expenses (Expenses dashboard upload)
 *  2) Manual ledger — ROI_VENDOR_EXPENSES_JSON (env fallback)
 *  3) OpenAI org costs API — when ROI_OPENAI_COSTS_ENABLED=true
 *
 * Output is a per-day EUR map plus vendor/category breakdown, allocated onto
 * events by runtime weight in aggregate.js.
 */

import { fetchOpenAiDailyCosts } from '@/server/roi/openaiCosts';
import { fetchConfirmedExpenseLedger } from '@/server/roi/expensesStore';
import {
  allocateVendorCostsToRows,
  buildDailyVendorCostMap,
  expandVendorExpenseEntry
} from '@/server/roi/vendorCostLedger';

export { allocateVendorCostsToRows, buildDailyVendorCostMap, expandVendorExpenseEntry };

function ensureDayBucket(map, day) {
  if (map.has(day)) return map.get(day);
  const bucket = { totalEur: 0, byVendor: {}, byCategory: {}, entries: [] };
  map.set(day, bucket);
  return bucket;
}

function mergeEntryIntoMap(merged, item) {
  if (!(item?.amountEur > 0) || !item.day) return;
  const bucket = ensureDayBucket(merged, item.day);
  bucket.totalEur += item.amountEur;
  bucket.byVendor[item.vendor] = (bucket.byVendor[item.vendor] || 0) + item.amountEur;
  bucket.byCategory[item.category] = (bucket.byCategory[item.category] || 0) + item.amountEur;
  bucket.entries.push(item);
}

/**
 * Merge DB invoices + env ledger + OpenAI actual daily costs into one day map.
 */
export async function fetchVendorDailyCosts({ startDay, endDay, config }) {
  const ledger = [...(config?.vendorExpenses || [])];

  try {
    const dbLedger = await fetchConfirmedExpenseLedger({ startDay, endDay });
    ledger.push(...dbLedger);
  } catch {
    /* DB ledger optional if table missing / unreachable */
  }

  const merged = buildDailyVendorCostMap(ledger);

  if (startDay && endDay) {
    for (const day of [...merged.keys()]) {
      if (day < startDay || day > endDay) merged.delete(day);
    }
  }

  try {
    const openAiDaily = await fetchOpenAiDailyCosts({ startDay, endDay, config });
    for (const [day, amountEur] of openAiDaily.entries()) {
      if (!(amountEur > 0)) continue;
      mergeEntryIntoMap(merged, {
        day,
        vendor: 'openai',
        category: 'llm',
        amountEur,
        source: 'openai_org_costs',
        note: ''
      });
    }
  } catch {
    /* OpenAI pull is optional — keep manual ledger */
  }

  return merged;
}
