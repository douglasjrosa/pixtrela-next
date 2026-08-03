/** Minimum hex length after normalization (typical NFC UID is 4+ bytes). */
export const MIN_USER_TAG_LENGTH = 4;

/**
 * Normalizes an NFC serial number for storage/lookup:
 * uppercase, strip `:`, `-`, and whitespace.
 */
export function normalizeUserTag(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const normalized = raw
    .trim()
    .toUpperCase()
    .replace(/[:\-\s]/g, "");
  if (normalized.length < MIN_USER_TAG_LENGTH) return null;
  return normalized;
}
