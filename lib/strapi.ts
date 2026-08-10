import { auth } from "@/auth";

import { isDrizzleBackend } from "@/lib/db/backend";
import { isAuthenticatedSession, redirectToLogin } from "@/lib/auth/session";
import { buildStrapiQuery, type StrapiQueryParams } from "./strapi/query";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

export type StrapiCacheOptions = {
  /** Next.js cache tags — invalidate with revalidateTag after mutations. */
  tags?: string[];
  /** Seconds until revalidation; false = cache until tagged invalidation. */
  revalidate?: number | false;
  /** Skip cache entirely (mutations and hot user-specific reads). */
  noStore?: boolean;
};

export type StrapiFetchInit = RequestInit & {
  strapiCache?: StrapiCacheOptions;
  /** When false, skip login redirect for unauthenticated reads. */
  requireAuth?: boolean;
  /** When false, 401 throws instead of redirecting to login (e.g. kiosk identify). */
  redirectOnUnauthorized?: boolean;
};

/**
 * Server-side Data Access Layer for Strapi REST API.
 * Builds lean query strings via qs; supports Next.js fetch caching tags.
 */
export async function strapiFetch<T>(
  path: string,
  init?: StrapiFetchInit,
  query?: StrapiQueryParams,
): Promise<T> {
  // Cutover guard: block Strapi HTTP when fallback is disabled.
  const { assertStrapiHttpAllowed } = await import("./strapi/migration-guard");
  assertStrapiHttpAllowed();

  const session = await auth();
  const {
    strapiCache,
    requireAuth = true,
    redirectOnUnauthorized = true,
    ...fetchInit
  } = init ?? {};
  const headers = new Headers(fetchInit.headers);
  headers.set("Content-Type", "application/json");

  const jwt = session?.jwt;
  if (requireAuth) {
    if (!isAuthenticatedSession(session)) {
      redirectToLogin();
    }
    // Drizzle sessions have no Strapi JWT — callers must use the Drizzle DAL.
    if (!jwt && isDrizzleBackend()) {
      throw new Error(`strapiUnavailable:drizzleSession (${path})`);
    }
    if (!jwt) {
      redirectToLogin();
    }
  }
  if (jwt) {
    headers.set("Authorization", `Bearer ${jwt}`);
  }

  const queryString = query ? buildStrapiQuery(query) : "";
  const url = `${STRAPI_URL}/api${path}${queryString}`;

  const requestInit: RequestInit = { ...fetchInit, headers };

  if (strapiCache?.noStore) {
    requestInit.cache = "no-store";
  } else if (strapiCache?.tags || strapiCache?.revalidate !== undefined) {
    requestInit.next = {
      tags: strapiCache.tags,
      revalidate: strapiCache.revalidate,
    };
  } else {
    requestInit.cache = "no-store";
  }

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "network error";
    throw new Error(`Strapi request failed (network): ${path}: ${message}`);
  }

  if (response.status === 401 && jwt && redirectOnUnauthorized) {
    redirectToLogin();
  }
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message ? `: ${body.error.message}` : "";
    } catch {
      detail = "";
    }
    throw new Error(
      `Strapi request failed (${response.status}): ${path}${detail}`,
    );
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export { buildStrapiQuery, type StrapiQueryParams } from "./strapi/query";
export { STRAPI_TAGS, balanceTag, dashboardColaboratorTag } from "./strapi/tags";
