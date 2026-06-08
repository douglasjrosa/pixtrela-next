import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export const SESSION_EXPIRED_QUERY = "sessionExpired";

export const LOGIN_PATH = `/login?reason=${SESSION_EXPIRED_QUERY}`;

/** True when the NextAuth session carries a Strapi JWT for API calls. */
export function isAuthenticatedSession(
  session: Session | null | undefined,
): boolean {
  return Boolean(session?.user?.id && session?.jwt);
}

/** Redirects to login when Strapi auth is missing or rejected. */
export function redirectToLogin(): never {
  redirect(LOGIN_PATH);
}
