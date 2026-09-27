export const TOTEM_MODE_COOKIE_NAME = "pixtrela-totem-mode";

const DAY_IN_SECONDS = 24 * 60 * 60;
export const TOTEM_MODE_COOKIE_MAX_AGE_SEC = 365 * DAY_IN_SECONDS;

/** Reads a bound user id from the totem-mode cookie value. */
export function readTotemModeUserId(
  cookieValue: string | undefined | null,
): string | undefined {
  if (!cookieValue) return undefined;
  const trimmed = cookieValue.trim();
  if (!trimmed || trimmed.includes("/") || /\s/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function isTotemModeActive(
  cookieUserId: string | undefined,
  sessionUserId: string | undefined,
): boolean {
  return Boolean(
    cookieUserId && sessionUserId && cookieUserId === sessionUserId,
  );
}

export function resolveTotemMode(
  cookieValue: string | undefined | null,
  sessionUserId?: string,
): boolean {
  return isTotemModeActive(readTotemModeUserId(cookieValue), sessionUserId);
}

/** HttpOnly cookie bound to the session user id. */
export function totemModeCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOTEM_MODE_COOKIE_MAX_AGE_SEC,
  };
}
