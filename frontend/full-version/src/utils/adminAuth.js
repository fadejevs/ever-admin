export const ADMIN_EMAIL_DOMAIN = '@everspeak.ai';

export function isAdminEmail(email) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  return normalized.endsWith(ADMIN_EMAIL_DOMAIN);
}

export function normalizeAdminEmail(email) {
  return String(email || '').trim().toLowerCase();
}
