/**
 * Blocks accidental Strapi calls for domains already cut over to Drizzle.
 */

export const MIGRATED_DOMAINS = [
  "awards",
  "steps",
  "currencies",
  "settings",
  "teams",
  "templates",
  "users",
  "profile",
  "media",
  "balances",
  "exchanges",
  "tasks",
  "board",
  "kiosk",
  "dashboard",
  "auth",
] as const;

export type MigratedDomain = (typeof MIGRATED_DOMAINS)[number];

export function isAuthStrapiFallbackEnabled(): boolean {
  const raw = process.env.AUTH_STRAPI_FALLBACK?.trim();
  if (raw === "0" || raw === "false") return false;
  if (raw === undefined || raw === "") return true;
  return raw === "1" || raw === "true";
}

/**
 * Call before any Strapi HTTP for a domain that should already be on Drizzle.
 */
export function assertStrapiAllowed(domain: MigratedDomain): void {
  const backend = process.env.DATA_BACKEND?.trim().toLowerCase();
  if (backend === "strapi") return;
  if (!isAuthStrapiFallbackEnabled() && MIGRATED_DOMAINS.includes(domain)) {
    throw new Error(
      `strapiForbidden:${domain} (DATA_BACKEND=drizzle, AUTH_STRAPI_FALLBACK=0)`,
    );
  }
}

/** Global gate used by strapiFetch when cutover disables Strapi entirely. */
export function assertStrapiHttpAllowed(): void {
  const backend = process.env.DATA_BACKEND?.trim().toLowerCase();
  if (backend === "strapi") return;
  if (!isAuthStrapiFallbackEnabled()) {
    throw new Error(
      "strapiForbidden:http (DATA_BACKEND=drizzle, AUTH_STRAPI_FALLBACK=0)",
    );
  }
}
