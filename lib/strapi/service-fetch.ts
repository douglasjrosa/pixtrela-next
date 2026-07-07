import { buildStrapiQuery, type StrapiQueryParams } from "./query";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

export class StrapiServiceError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "StrapiServiceError";
    this.status = status;
  }
}

export type StrapiServiceFetchInit = RequestInit & {
  query?: StrapiQueryParams;
};

/**
 * Server-side Strapi fetch authenticated with STRAPI_SYNC_API_TOKEN.
 * Used by CRM sync (no user session required for writes).
 */
export async function strapiServiceFetch<T>(
  path: string,
  init?: StrapiServiceFetchInit,
): Promise<T> {
  const token = process.env.STRAPI_SYNC_API_TOKEN;
  if (!token) {
    throw new Error("STRAPI_SYNC_API_TOKEN must be set.");
  }

  const { query, ...fetchInit } = init ?? {};
  const headers = new Headers(fetchInit.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const queryString = query ? buildStrapiQuery(query) : "";
  const url = `${STRAPI_URL}/api${path}${queryString}`;

  const response = await fetch(url, {
    ...fetchInit,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message ? `: ${body.error.message}` : "";
    } catch {
      detail = "";
    }
    throw new StrapiServiceError(
      response.status,
      `Strapi service request failed (${response.status})${detail}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}