import { describe, expect, it } from "vitest";

import { isUniqueViolation, PG_UNIQUE_VIOLATION } from "./pg-error";

describe("isUniqueViolation", () => {
  it("matches a raw Postgres unique_violation", () => {
    expect(isUniqueViolation({ code: PG_UNIQUE_VIOLATION })).toBe(true);
  });

  it("matches a Drizzle-wrapped unique_violation", () => {
    expect(
      isUniqueViolation({
        message: "Failed query",
        cause: { code: PG_UNIQUE_VIOLATION },
      }),
    ).toBe(true);
  });

  it("rejects other errors", () => {
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
  });
});
