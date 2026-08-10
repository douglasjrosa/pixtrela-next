import { describe, expect, it } from "vitest";

import {
  calculateDurationCurrencyCredits,
  calculateDurationSecondsCurrency,
  calculateQtySessionCurrency,
  rescaleExpectedTimeForTaskQtyChange,
  resolveSecondsPerPiece,
  resolveSubTaskTargetQty,
  scaleExpectedTimeByTaskQty,
  shouldCreditDurationCurrency,
} from "./work-currency";

describe("scaleExpectedTimeByTaskQty", () => {
  it("multiplies base expected time by task qty", () => {
    expect(scaleExpectedTimeByTaskQty(30, 10)).toBe(300);
    expect(scaleExpectedTimeByTaskQty(120, 1)).toBe(120);
  });

  it("uses at least 1 for task qty", () => {
    expect(scaleExpectedTimeByTaskQty(30, 0)).toBe(30);
  });
});

describe("rescaleExpectedTimeForTaskQtyChange", () => {
  it("rescales stored expected time when task qty changes", () => {
    expect(rescaleExpectedTimeForTaskQtyChange(300, 10, 5)).toBe(150);
    expect(rescaleExpectedTimeForTaskQtyChange(120, 1, 10)).toBe(1200);
  });
});

describe("resolveSubTaskTargetQty", () => {
  it("multiplies sub-task qty by task qty", () => {
    expect(resolveSubTaskTargetQty(2, 10)).toBe(20);
    expect(resolveSubTaskTargetQty(2, 1)).toBe(2);
  });
});

describe("resolveSecondsPerPiece", () => {
  it("divides stored expectedTime by task.qty * subTask.qty", () => {
    expect(resolveSecondsPerPiece(300, 2, 10)).toBe(15);
    expect(resolveSecondsPerPiece(120, 2, 1)).toBe(60);
  });
});

describe("calculateQtySessionCurrency", () => {
  const currency = { currencyPerSecond: 1 };

  it("pays per piece using expected time share", () => {
    const context = {
      expectedTime: 300,
      qty: 2,
      taskQty: 10,
      sharingType: "qty" as const,
    };
    expect(
      calculateQtySessionCurrency(context, { sessionQty: 5 }, currency),
    ).toBe(75);
  });

  it("returns 0 for duration sharing", () => {
    expect(
      calculateQtySessionCurrency(
        {
          expectedTime: 120,
          qty: 1,
          taskQty: 1,
          sharingType: "duration",
        },
        { sessionQty: 1 },
        currency,
      ),
    ).toBe(0);
  });
});

describe("calculateDurationCurrencyCredits", () => {
  const currency = { currencyPerSecond: 1 };
  const context = {
    expectedTime: 300,
    qty: 2,
    taskQty: 10,
    sharingType: "duration" as const,
  };

  it("splits expected pool by time-spent share with ceil", () => {
    expect(
      calculateDurationCurrencyCredits(
        context,
        [
          { colaboratorId: "a", timeSpentSeconds: 150 },
          { colaboratorId: "b", timeSpentSeconds: 100 },
          { colaboratorId: "c", timeSpentSeconds: 200 },
        ],
        currency,
      ),
    ).toEqual([
      { colaboratorId: "a", amount: 100 },
      { colaboratorId: "b", amount: 67 },
      { colaboratorId: "c", amount: 134 },
    ]);
  });
});

describe("shouldCreditDurationCurrency", () => {
  it("credits only on stop when sub-task is finished", () => {
    expect(
      shouldCreditDurationCurrency({
        action: "stoped",
        subTaskStatus: "finished",
      }),
    ).toBe(true);
    expect(
      shouldCreditDurationCurrency({
        action: "stoped",
        subTaskStatus: "producing",
      }),
    ).toBe(false);
  });
});

describe("calculateDurationSecondsCurrency", () => {
  it("floors duration * rate", () => {
    expect(
      calculateDurationSecondsCurrency({
        durationSeconds: 60,
        currencyPerSecond: 0.5,
      }),
    ).toBe(30);
  });
});
