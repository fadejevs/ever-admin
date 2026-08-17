import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allocateVendorCostsToRows,
  buildDailyVendorCostMap,
  expandVendorExpenseEntry
} from './vendorCostLedger.js';

test('expands a single-day invoice entry', () => {
  const rows = expandVendorExpenseEntry({
    day: '2026-07-01',
    vendor: 'DeepL',
    category: 'translation',
    amount_eur: 49.99
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].vendor, 'deepl');
  assert.equal(rows[0].category, 'translation');
  assert.equal(rows[0].amountEur, 49.99);
});

test('spreads a period invoice evenly across days', () => {
  const rows = expandVendorExpenseEntry({
    vendor: 'elevenlabs',
    category: 'asr',
    amount_eur: 310,
    period_start: '2026-07-01',
    period_end: '2026-07-31'
  });
  assert.equal(rows.length, 31);
  const total = rows.reduce((sum, row) => sum + row.amountEur, 0);
  assert.ok(Math.abs(total - 310) < 1e-6);
});

test('builds daily map with vendor + category buckets', () => {
  const map = buildDailyVendorCostMap([
    { day: '2026-07-10', vendor: 'gcp', category: 'other', amount_eur: 40 },
    { day: '2026-07-10', vendor: 'deepl', category: 'translation', amount_eur: 10 }
  ]);
  const day = map.get('2026-07-10');
  assert.equal(day.totalEur, 50);
  assert.equal(day.byVendor.gcp, 40);
  assert.equal(day.byVendor.deepl, 10);
  assert.equal(day.byCategory.translation, 10);
  assert.equal(day.byCategory.other, 40);
});

test('allocates vendor costs by runtime weight and tags cost_source', () => {
  const rows = [
    {
      runtime_seconds: 300,
      api_cost_asr: 1,
      api_cost_translation: 1,
      api_cost_tts: 1,
      api_cost_llm: 1,
      api_cost_total: 4
    },
    {
      runtime_seconds: 100,
      api_cost_asr: 1,
      api_cost_translation: 1,
      api_cost_tts: 1,
      api_cost_llm: 1,
      api_cost_total: 4
    }
  ];
  const dayBucket = {
    totalEur: 40,
    byVendor: { deepl: 40 },
    byCategory: { translation: 40 },
    entries: []
  };
  allocateVendorCostsToRows(rows, dayBucket);
  assert.equal(rows[0].api_cost_translation, 30);
  assert.equal(rows[1].api_cost_translation, 10);
  assert.equal(rows[0].cost_source, 'vendor_actual');
  assert.equal(rows[0].vendor_actual_allocated, 30);
});
