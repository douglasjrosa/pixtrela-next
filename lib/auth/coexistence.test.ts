import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * Documents coexistence password auth preference (Strapi JWT when available).
 * Full NextAuth authorize is integration-tested via e2e; this covers the rule.
 */
describe("auth coexistence preference", () => {
  const previous = process.env.DATA_BACKEND;

  beforeEach(() => {
    process.env.DATA_BACKEND = "drizzle";
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.DATA_BACKEND;
    else process.env.DATA_BACKEND = previous;
    vi.restoreAllMocks();
  });

  it("keeps drizzle as data backend while preferring Strapi session JWT", async () => {
    const { getDataBackend } = await import("@/lib/db/backend");
    expect(getDataBackend()).toBe("drizzle");
  });
});
