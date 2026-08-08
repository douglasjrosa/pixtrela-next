import {
  KIOSK_HOME_PATH,
  LOGIN_PATH,
  resolveRouteAccess,
} from "@/lib/auth/colaborator-routes";
import type { Role } from "@/lib/auth/nav";

/** Role home used when callback is missing or not allowed. */
export function defaultHomeForRole(
  role: Role | undefined,
  userId: string | undefined,
): string {
  if (role === "kiosk") return KIOSK_HOME_PATH;
  if (role === "colaborator" && userId) return `/${userId}`;
  return "/";
}

/**
 * Accepts only same-origin relative paths (not `//…` open redirects, not login).
 */
export function sanitizeCallbackUrl(callbackUrl: string | null): string | null {
  if (!callbackUrl) return null;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return null;
  const pathname = callbackUrl.split("?")[0] ?? callbackUrl;
  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
    return null;
  }
  return callbackUrl;
}

/**
 * Post-login path that middleware will allow for this role (no bounce hop).
 */
export function resolvePostLoginDestination(
  role: Role | undefined,
  userId: string | undefined,
  callbackUrl: string | null,
): string {
  const fallback = defaultHomeForRole(role, userId);
  if (role === "kiosk" || role === "colaborator") return fallback;

  const safeCallback = sanitizeCallbackUrl(callbackUrl);
  if (!safeCallback) return fallback;

  const pathname = safeCallback.split("?")[0] ?? safeCallback;
  const decision = resolveRouteAccess(pathname, {
    isAuthenticated: true,
    role,
    userId,
  });
  if (decision.action === "allow") return safeCallback;
  return fallback;
}
