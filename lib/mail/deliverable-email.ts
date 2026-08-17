const SYNTHETIC_EMAIL_SUFFIX = ".local";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isDeliverableEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) return false;
  return !normalized.endsWith(SYNTHETIC_EMAIL_SUFFIX);
}
