/**
 * Linear-ticket live proofs (EVE-53 AUTO …) are real rows in `events`
 * but should not appear in admin history / live / upcoming.
 */

const AUTO_TITLE = /^\s*EVE-\d+\s+AUTO\b/i;
const AUTO_DESCRIPTION = /^\s*Automated YouTube virtual-microphone continuity proof\s*$/i;

export function isAutomationEvent(event) {
  const title = String(event?.title || event?.name || '');
  if (AUTO_TITLE.test(title)) return true;
  const description = String(event?.description || '');
  return AUTO_DESCRIPTION.test(description);
}

export function withoutAutomationEvents(events = []) {
  return events.filter((event) => !isAutomationEvent(event));
}
