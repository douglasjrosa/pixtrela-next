import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";

/** Per-request cached session (dedupes layout + page auth calls). */
export const getAppSession = cache(() => auth());

export const SESSION_EXPIRED_QUERY = "sessionExpired";

export const LOGIN_PATH = `/login?reason=${SESSION_EXPIRED_QUERY}`;

/**
 * True when Auth.js has a usable session.
 * Drizzle sessions may have an empty `jwt` (no Strapi token).
 */
export function isAuthenticatedSession(
  session: Session | null | undefined,
): boolean {
  return Boolean(session?.user?.id && session?.user?.role);
}

/** Redirects to login when auth is missing or rejected. */
export function redirectToLogin(): never {
  redirect(LOGIN_PATH);
}
