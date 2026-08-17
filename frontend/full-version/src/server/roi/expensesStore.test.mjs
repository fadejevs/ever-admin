import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeExpenseInput } from './expensesNormalize.js';

test('normalizeExpenseInput accepts single-day invoice', () => {
  const row = normalizeExpenseInput({
    vendor: 'DeepL',
    category: 'translation',
    amount_eur: 49.99,
    day: '2026-08-01',
    status: 'confirmed'
  });
  assert.equal(row.vendor, 'deepl');
  assert.equal(row.category, 'translation');
  assert.equal(row.day, '2026-08-01');
  assert.equal(row.period_start, null);
  assert.equal(row.status, 'confirmed');
  assert.ok(row.confirmed_at);
});

test('normalizeExpenseInput accepts billing period', () => {
  const row = normalizeExpenseInput({
    vendor: 'elevenlabs',
    category: 'asr',
    amount_eur: 120,
    period_start: '2026-07-01',
    period_end: '2026-07-31'
  });
  assert.equal(row.day, null);
  assert.equal(row.period_start, '2026-07-01');
  assert.equal(row.period_end, '2026-07-31');
  assert.equal(row.status, 'draft');
});

test('normalizeExpenseInput rejects missing dates', () => {
  assert.throws(() => normalizeExpenseInput({ vendor: 'x', amount_eur: 1 }), /day or period/);
});
