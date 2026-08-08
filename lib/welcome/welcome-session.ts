import type { GreetingGender } from "@/lib/business/kiosk-welcome";

export const WELCOME_SESSION_KEY = "pixtrela:welcome";

export type WelcomePayload = {
  name: string;
  greetingGender?: GreetingGender | null;
  avatarUrl?: string | null;
  facePhotoUrl?: string | null;
};

export function isWelcomePayload(value: unknown): value is WelcomePayload {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.name === "string" && record.name.trim().length > 0;
}

/** Stores welcome data so the destination route can show the modal. */
export function stashWelcomePayload(payload: WelcomePayload): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(WELCOME_SESSION_KEY, JSON.stringify(payload));
}

/** Reads a pending welcome payload without clearing it. */
export function peekWelcomePayload(): WelcomePayload | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(WELCOME_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isWelcomePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Clears a pending welcome payload, if any. */
export function clearWelcomePayload(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(WELCOME_SESSION_KEY);
}

/** Reads and clears a pending welcome payload, if any. */
export function consumeWelcomePayload(): WelcomePayload | null {
  const payload = peekWelcomePayload();
  if (payload) clearWelcomePayload();
  return payload;
}
