/**
 * Billable units per billing schema (EVE-11 / billing_schema_updates.md):
 * floor(chargeable_seconds / 3600) × target_language_count
 */
export function computeBillableUnits(chargeableSeconds, targetLanguageCount) {
  const seconds = Math.max(0, Number(chargeableSeconds || 0));
  const langs = Math.max(1, Number(targetLanguageCount || 0));
  return Math.floor(seconds / 3600) * langs;
}

export function resolveEventUnits({ chargeableSeconds, targetLanguageCount, ledgerUnits = 0 }) {
  const estimatedUnits = computeBillableUnits(chargeableSeconds, targetLanguageCount);
  const billedUnits = Math.max(0, Number(ledgerUnits || 0));
  return {
    estimatedUnits,
    ledgerUnits: billedUnits,
    unitsConsumed: Math.max(billedUnits, estimatedUnits),
    isEstimated: billedUnits === 0 && estimatedUnits > 0
  };
}
