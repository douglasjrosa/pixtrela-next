import { describe, expect, it } from "vitest";

import {
  calculateChainRunCredits,
  diffChainRunCredits,
} from "./subtask-chain-credits";

describe("calculateChainRunCredits", () => {
  it("splits duration pool by participation after allocation", () => {
    const awards = calculateChainRunCredits({
      currencyPerSecond: 2,
      members: [
        {
          documentId: "a",
          sharingType: "duration",
          expectedTime: 10,
          qty: 1,
          taskQty: 1,
          finishedThisRun: true,
        },
      ],
      participations: [
        {
          colaboratorId: "u1",
          subTaskId: "a",
          timeSpentSeconds: 6,
          qty: 0,
        },
        {
          colaboratorId: "u2",
          subTaskId: "a",
          timeSpentSeconds: 4,
          qty: 0,
        },
      ],
    });
    expect(awards).toEqual([
      { colaboratorId: "u1", subTaskId: "a", amount: 12 },
      { colaboratorId: "u2", subTaskId: "a", amount: 8 },
    ]);
  });

  it("skips duration credits when the member is pending", () => {
    const awards = calculateChainRunCredits({
      currencyPerSecond: 2,
      members: [
        {
          documentId: "a",
          sharingType: "duration",
          expectedTime: 10,
          qty: 1,
          taskQty: 1,
          finishedThisRun: false,
        },
      ],
      participations: [
        {
          colaboratorId: "u1",
          subTaskId: "a",
          timeSpentSeconds: 10,
          qty: 0,
        },
      ],
    });
    expect(awards).toEqual([]);
  });

  it("credits qty by pieces even when the member stays pending", () => {
    const awards = calculateChainRunCredits({
      currencyPerSecond: 1,
      members: [
        {
          documentId: "a",
          sharingType: "qty",
          expectedTime: 10,
          qty: 2,
          taskQty: 1,
          finishedThisRun: false,
        },
      ],
      participations: [
        {
          colaboratorId: "u1",
          subTaskId: "a",
          timeSpentSeconds: 3,
          qty: 1,
        },
      ],
    });
    expect(awards).toEqual([
      { colaboratorId: "u1", subTaskId: "a", amount: 5 },
    ]);
  });
});

describe("diffChainRunCredits", () => {
  it("computes deltas against previous awards", () => {
    const deltas = diffChainRunCredits(
      [{ colaboratorId: "u1", subTaskId: "a", amount: 12 }],
      [{ colaboratorId: "u1", subTaskId: "a", amount: 20 }],
    );
    expect(deltas).toEqual([
      {
        colaboratorId: "u1",
        subTaskId: "a",
        amount: 12,
        previousAmount: 20,
        delta: -8,
      },
    ]);
  });
});
