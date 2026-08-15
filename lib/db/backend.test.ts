import { describe, expect, it } from "vitest";

import { getDataBackend } from "./backend";

describe("data backend", () => {
  it("always uses drizzle", () => {
    expect(getDataBackend()).toBe("drizzle");
  });
});
