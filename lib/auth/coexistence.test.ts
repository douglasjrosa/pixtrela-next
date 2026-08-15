import { describe, expect, it } from "vitest";

import { getDataBackend } from "@/lib/db/backend";

describe("auth data backend", () => {
  it("uses drizzle-only persistence", () => {
    expect(getDataBackend()).toBe("drizzle");
  });
});
