import test from 'node:test';
import assert from 'node:assert/strict';

import { isAutomationEvent, withoutAutomationEvents } from './automationEvents.js';

test('isAutomationEvent matches EVE-n AUTO titles', () => {
  assert.equal(isAutomationEvent({ title: 'EVE-53 AUTO HEALTHY-TTS single-lv 1787818815224' }), true);
  assert.equal(isAutomationEvent({ title: 'EVE-53 AUTO DUO-TTS-STALL dual-alternating 1787904591315' }), true);
  assert.equal(isAutomationEvent({ title: 'prueba everspeak' }), false);
  assert.equal(isAutomationEvent({ title: 'HR Savaitė Lietuva' }), false);
});

test('isAutomationEvent matches the continuity-proof description', () => {
  assert.equal(
    isAutomationEvent({
      title: 'accidental rename',
      description: 'Automated YouTube virtual-microphone continuity proof'
    }),
    true
  );
});

test('withoutAutomationEvents keeps only real rows', () => {
  const kept = withoutAutomationEvents([
    { id: '1', title: 'EVE-53 AUTO ASR single-en 1' },
    { id: '2', title: 'demo event' },
    { id: '3', title: 'EVE-53 AUTO DYNAMIC-LANGUAGE dual-alternating 2' }
  ]);
  assert.deepEqual(
    kept.map((row) => row.id),
    ['2']
  );
});
