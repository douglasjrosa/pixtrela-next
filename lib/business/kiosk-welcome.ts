export type GreetingGender = "masculine" | "feminine";

export const KIOSK_FACE_WELCOME_MS = 800;
/** Fade-out length at the end of the welcome screen. */
export const KIOSK_FACE_WELCOME_FADE_MS = 300;

/** First token of a display name (e.g. "Ana Silva" → "Ana"). */
export function firstNameFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

/**
 * Gendered kiosk welcome after face match.
 * Defaults to masculine when gender is missing.
 */
export function formatKioskWelcomeMessage(
  name: string,
  greetingGender?: GreetingGender | null,
): string {
  const firstName = firstNameFromDisplayName(name) || name.trim();
  if (greetingGender === "feminine") {
    return `Bem vinda ${firstName}!`;
  }
  return `Bem vindo ${firstName}!`;
}
