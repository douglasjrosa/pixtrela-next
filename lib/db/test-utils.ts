import { describe } from "vitest";

/**
 * Integration test helper.
 * Opt-in via RUN_DB_TESTS=1 (and DATABASE_URL) so the default `npm test`
 * suite never hangs on an open Postgres pool.
 */
export function databaseUrlConfigured(): boolean {
  return Boolean(
    process.env.RUN_DB_TESTS === "1" && process.env.DATABASE_URL?.trim(),
  );
}

export const describeWithDb = databaseUrlConfigured()
  ? describe
  : describe.skip;
