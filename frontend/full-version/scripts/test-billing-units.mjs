import assert from 'node:assert/strict';
import { computeBillableUnits, resolveEventUnits } from '../src/utils/billingUnits.js';

assert.equal(computeBillableUnits(38456, 2), 20);
assert.equal(computeBillableUnits(6347, 1), 1);
assert.equal(computeBillableUnits(1786, 2), 0);

const rimi = resolveEventUnits({ chargeableSeconds: 38456, targetLanguageCount: 2, ledgerUnits: 0 });
assert.equal(rimi.unitsConsumed, 20);
assert.equal(rimi.isEstimated, true);

const billed = resolveEventUnits({ chargeableSeconds: 7200, targetLanguageCount: 2, ledgerUnits: 4 });
assert.equal(billed.unitsConsumed, 4);
assert.equal(billed.isEstimated, false);

console.log('billingUnits tests passed');
