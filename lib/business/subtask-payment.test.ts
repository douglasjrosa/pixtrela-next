import { describe, expect, it } from "vitest";

import {
  calculateColaboratorEarnings,
  calculateParticipationPercent,
  calculateSubtaskPayment,
} from "./subtask-payment";

describe("calculateSubtaskPayment", () => {
  it("multiplies expectedTime by currencyPerSecond", () => {
    expect(calculateSubtaskPayment(60, 2)).toBe(120);
  });

  it("treats negative inputs as zero", () => {
    expect(calculateSubtaskPayment(-10, 2)).toBe(0);
    expect(calculateSubtaskPayment(60, -1)).toBe(0);
  });
});

describe("calculateParticipationPercent", () => {
  it("rounds share of timeSpent up to a percent", () => {
    expect(calculateParticipationPercent(61, 120)).toBe(51);
    expect(calculateParticipationPercent(120, 120)).toBe(100);
  });

  it("returns 0 when timeSpent is zero", () => {
    expect(calculateParticipationPercent(30, 0)).toBe(0);
  });
});

describe("calculateColaboratorEarnings", () => {
  it("ceil-splits the duration pool by session duration share", () => {
    expect(
      calculateColaboratorEarnings({
        sharingType: "duration",
        colaboratorDurationSec: 60,
        colaboratorQty: 0,
        totalDurationSec: 120,
        totalQty: 0,
        expectedTime: 60,
        currencyPerSecond: 2,
      }),
    ).toBe(60);
  });

  it("ceil-splits the pool by qty share for qty sharing", () => {
    expect(
      calculateColaboratorEarnings({
        sharingType: "qty",
        colaboratorDurationSec: 10,
        colaboratorQty: 3,
        totalDurationSec: 40,
        totalQty: 10,
        expectedTime: 100,
        currencyPerSecond: 1,
      }),
    ).toBe(30);
  });
});
