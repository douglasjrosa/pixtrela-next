import { describe, expect, it } from "vitest";

import { isPossibleProductionGap } from "./production-gap";

const WINDOW_START = new Date("2026-11-24T09:00:00.000Z");

describe("isPossibleProductionGap", () => {
  it("is false before the productive window starts", () => {
    expect(
      isPossibleProductionGap({
        windowStartedAt: WINDOW_START,
        now: new Date("2026-11-24T08:59:00.000Z"),
        lastStartAt: null,
        toleranceMinutes: 30,
      }),
    ).toBe(false);
  });

  it("is false during the grace period without a start", () => {
    expect(
      isPossibleProductionGap({
        windowStartedAt: WINDOW_START,
        now: new Date("2026-11-24T09:29:00.000Z"),
        lastStartAt: null,
        toleranceMinutes: 30,
      }),
    ).toBe(false);
  });

  it("is true after grace when the colaborator never started", () => {
    expect(
      isPossibleProductionGap({
        windowStartedAt: WINDOW_START,
        now: new Date("2026-11-24T09:30:00.000Z"),
        lastStartAt: null,
        toleranceMinutes: 30,
      }),
    ).toBe(true);
  });

  it("is false when they started after the window opened", () => {
    expect(
      isPossibleProductionGap({
        windowStartedAt: WINDOW_START,
        now: new Date("2026-11-24T10:00:00.000Z"),
        lastStartAt: new Date("2026-11-24T09:05:00.000Z"),
        toleranceMinutes: 30,
      }),
    ).toBe(false);
  });

  it("treats a start from a previous day as no start today", () => {
    expect(
      isPossibleProductionGap({
        windowStartedAt: WINDOW_START,
        now: new Date("2026-11-24T09:31:00.000Z"),
        lastStartAt: new Date("2026-11-23T18:00:00.000Z"),
        toleranceMinutes: 30,
      }),
    ).toBe(true);
  });

  it("treats zero tolerance as a gap at window start", () => {
    expect(
      isPossibleProductionGap({
        windowStartedAt: WINDOW_START,
        now: WINDOW_START,
        lastStartAt: null,
        toleranceMinutes: 0,
      }),
    ).toBe(true);
  });
});
