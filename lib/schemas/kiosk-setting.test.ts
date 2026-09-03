import { describe, expect, it } from "vitest";

import {
  kioskSessionIdleSchema,
  normalizeKioskQueuePageSize,
} from "./kiosk-setting";

describe("kioskSessionIdleSchema", () => {
  const valid = {
    sessionIdleSeconds: 7,
    maxSimultaneousSubtaskIntervalSeconds: 300,
    queuePageSize: 15,
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

  it("accepts queue page size from 1 to 50", () => {
    expect(
      kioskSessionIdleSchema.safeParse({ ...valid, queuePageSize: 1 }).success,
    ).toBe(true);
    expect(
      kioskSessionIdleSchema.safeParse({ ...valid, queuePageSize: 50 }).success,
    ).toBe(true);
  });

  it("rejects queue page size outside 1..50", () => {
    expect(
      kioskSessionIdleSchema.safeParse({ ...valid, queuePageSize: 0 }).success,
    ).toBe(false);
    expect(
      kioskSessionIdleSchema.safeParse({ ...valid, queuePageSize: 51 }).success,
    ).toBe(false);
  });
});

describe("normalizeKioskQueuePageSize", () => {
  it("clamps to the allowed range", () => {
    expect(normalizeKioskQueuePageSize(0)).toBe(1);
    expect(normalizeKioskQueuePageSize(100)).toBe(50);
    expect(normalizeKioskQueuePageSize(12.7)).toBe(12);
  });
});
