import { describe, expect, it } from "vitest";

import { kioskSessionIdleSchema } from "./kiosk-setting";

describe("kioskSessionIdleSchema", () => {
  it("accepts values within the allowed range", () => {
    expect(kioskSessionIdleSchema.safeParse({ sessionIdleSeconds: 7 }).success).toBe(
      true,
    );
  });

  it("rejects values below 1 second", () => {
    expect(kioskSessionIdleSchema.safeParse({ sessionIdleSeconds: 0 }).success).toBe(
      false,
    );
  });

  it("rejects values above 3600 seconds", () => {
    expect(
      kioskSessionIdleSchema.safeParse({ sessionIdleSeconds: 3601 }).success,
    ).toBe(false);
  });
});
