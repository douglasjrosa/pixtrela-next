const LIKE_SPECIAL = /[\\%_]/g;

/** Substring pattern: the typed text, wrapped as `%text%`. */
export function logTextLikePattern(raw: string): string {
  const escaped = raw.trim().replace(LIKE_SPECIAL, (char) => `\\${char}`);
  return `%${escaped}%`;
}
