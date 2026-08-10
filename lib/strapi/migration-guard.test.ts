import { describe, expect, it } from "vitest";

import {
  assertStrapiAllowed,
  assertStrapiHttpAllowed,
  isAuthStrapiFallbackEnabled,
} from "./migration-guard";

describe("migration-guard", () => {
  it("allows Strapi when fallback is enabled (default)", () => {
    const previous = process.env.AUTH_STRAPI_FALLBACK;
    delete process.env.AUTH_STRAPI_FALLBACK;
    expect(isAuthStrapiFallbackEnabled()).toBe(true);
    expect(() => assertStrapiAllowed("tasks")).not.toThrow();
    if (previous === undefined) delete process.env.AUTH_STRAPI_FALLBACK;
    else process.env.AUTH_STRAPI_FALLBACK = previous;
  });

  it("blocks migrated domains when fallback is off and backend is drizzle", () => {
    const prevFallback = process.env.AUTH_STRAPI_FALLBACK;
    const prevBackend = process.env.DATA_BACKEND;
    process.env.AUTH_STRAPI_FALLBACK = "0";
    process.env.DATA_BACKEND = "drizzle";
    expect(() => assertStrapiAllowed("tasks")).toThrow(/strapiForbidden:tasks/);
    expect(() => assertStrapiHttpAllowed()).toThrow(/strapiForbidden:http/);
    if (prevFallback === undefined) delete process.env.AUTH_STRAPI_FALLBACK;
    else process.env.AUTH_STRAPI_FALLBACK = prevFallback;
    if (prevBackend === undefined) delete process.env.DATA_BACKEND;
    else process.env.DATA_BACKEND = prevBackend;
  });
});
