import test from 'node:test';
import assert from 'node:assert/strict';

import { isEventId, normalizePeakViewerCount } from './peakViewerCount.js';

test('normalizePeakViewerCount clamps junk to 0', () => {
  assert.equal(normalizePeakViewerCount(32), 32);
  assert.equal(normalizePeakViewerCount('14'), 14);
  assert.equal(normalizePeakViewerCount(-2), 0);
  assert.equal(normalizePeakViewerCount('nope'), 0);
});

test('isEventId accepts event UUIDs only', () => {
  assert.equal(isEventId('2140becf-5a15-4402-8ab7-7d17451429df'), true);
  assert.equal(isEventId('lobby'), false);
});
