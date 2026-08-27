import { describe, expect, it } from "vitest";

import {
  calculateDurationCurrencyCredits,
  calculateDurationSecondsCurrency,
  calculateQtySessionCurrency,
  rescaleExpectedTimeForTaskQtyChange,
  rescaleQtyForTaskQtyChange,
  resolveSecondsPerPiece,
  resolveSubTaskTargetQty,
  scaleExpectedTimeByTaskQty,
  scaleTemplateSubTaskForTask,
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

describe("scaleTemplateSubTaskForTask", () => {
  it("scales structural qty and per-piece expected time by task qty", () => {
    expect(
      scaleTemplateSubTaskForTask({
        templateQty: 2,
        templateExpectedTime: 31,
        taskQty: 10,
      }),
    ).toEqual({ qty: 20, expectedTime: 620 });
  });
});

describe("rescaleExpectedTimeForTaskQtyChange", () => {
  it("rescales stored expected time when task qty changes", () => {
    expect(rescaleExpectedTimeForTaskQtyChange(620, 10, 5)).toBe(310);
    expect(rescaleExpectedTimeForTaskQtyChange(120, 1, 10)).toBe(1200);
  });
});

describe("rescaleQtyForTaskQtyChange", () => {
  it("rescales stored qty when task qty changes", () => {
    expect(rescaleQtyForTaskQtyChange(20, 10, 5)).toBe(10);
    expect(rescaleQtyForTaskQtyChange(2, 1, 10)).toBe(20);
  });
});

describe("resolveSubTaskTargetQty", () => {
  it("returns the stored sub-task qty without multiplying by task qty", () => {
    expect(resolveSubTaskTargetQty(20)).toBe(20);
    expect(resolveSubTaskTargetQty(2)).toBe(2);
  });
});

describe("resolveSecondsPerPiece", () => {
  it("divides stored expectedTime by sub-task qty", () => {
    expect(resolveSecondsPerPiece(620, 20)).toBe(31);
    expect(resolveSecondsPerPiece(120, 2)).toBe(60);
  });
});

describe("calculateQtySessionCurrency", () => {
  const currency = { currencyPerSecond: 1 };

  it("pays per piece using expected time share", () => {
    const context = {
      expectedTime: 620,
      qty: 20,
      taskQty: 10,
      sharingType: "qty" as const,
    };
    expect(
      calculateQtySessionCurrency(context, { sessionQty: 5 }, currency),
    ).toBe(155);
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
