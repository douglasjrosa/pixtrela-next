import { describe, expect, it } from "vitest";

import { kioskSessionIdleSchema } from "./kiosk-setting";

describe("kioskSessionIdleSchema", () => {
  const valid = {
    sessionIdleSeconds: 7,
    maxSimultaneousSubtaskIntervalSeconds: 300,
  };

  it("accepts values within the allowed range", () => {
    expect(kioskSessionIdleSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects idle values below 1 second", () => {
    expect(
      kioskSessionIdleSchema.safeParse({
        ...valid,
        sessionIdleSeconds: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects idle values above 3600 seconds", () => {
    expect(
      kioskSessionIdleSchema.safeParse({
        ...valid,
        sessionIdleSeconds: 3601,
      }).success,
    ).toBe(false);
  });

  it("accepts a live-chain interval of 0", () => {
    expect(
      kioskSessionIdleSchema.safeParse({
        ...valid,
        maxSimultaneousSubtaskIntervalSeconds: 0,
      }).success,
    ).toBe(true);
  });

  it("rejects a negative live-chain interval", () => {
    expect(
      kioskSessionIdleSchema.safeParse({
        ...valid,
        maxSimultaneousSubtaskIntervalSeconds: -1,
      }).success,
    ).toBe(false);
  });
});
