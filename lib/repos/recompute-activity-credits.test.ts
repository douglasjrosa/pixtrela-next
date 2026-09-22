import { describe, expect, it } from "vitest";

import { calculateChainRunCredits } from "@/lib/business/subtask-chain-credits";
import { firstDayOfMonth } from "@/lib/domain/balance";
import { calculateQtySessionCurrency } from "@/lib/domain/work-currency";

import {
  earliestCascadeTargets,
  listAwardAdjustments,
} from "./recompute-activity-credits";

const QTY_CONTEXT = {
  expectedTime: 10,
  qty: 10,
  taskQty: 1,
  sharingType: "qty" as const,
};

const RATE = { currencyPerSecond: 1 };

describe("isolated qty replay diffs", () => {
  it("updates currency_awarded and the month of the stop timestamp", () => {
    const timestamp = new Date("2026-08-09T13:00:00.000Z");
    const previousAmount = calculateQtySessionCurrency(
      QTY_CONTEXT,
      { sessionQty: 3 },
      RATE,
    );
    const nextAmount = calculateQtySessionCurrency(
      QTY_CONTEXT,
      { sessionQty: 7 },
      RATE,
    );
    expect(previousAmount).toBe(3);
    expect(nextAmount).toBe(7);

    const snapshot = {
      activityId: "stop-1",
      colaboratorId: "u1",
      timestamp,
    };
    expect(
      listAwardAdjustments(
        [{ ...snapshot, amount: previousAmount }],
        [{ ...snapshot, amount: nextAmount }],
      ),
    ).toEqual([
      { colaboratorId: "u1", timestamp, delta: -3 },
      { colaboratorId: "u1", timestamp, delta: 7 },
    ]);
    expect(firstDayOfMonth(timestamp)).toBe("2026-08-01");
  });
});

describe("cascade targets", () => {
  it("cascades only the touched currency from its earliest month", () => {
    const august = new Date("2026-08-09T13:00:00.000Z");
    const september = new Date("2026-09-02T13:00:00.000Z");
    expect(
      earliestCascadeTargets([
        {
          colaboratorId: "u1",
          timestamp: september,
          currencyPluralTitle: "Estrelas",
        },
        {
          colaboratorId: "u1",
          timestamp: august,
          currencyPluralTitle: "Estrelas",
        },
        {
          colaboratorId: "u1",
          timestamp: september,
          currencyPluralTitle: "Pontos",
        },
      ]),
    ).toEqual([
      { userId: "u1", currencyPluralTitle: "Estrelas", from: august },
      { userId: "u1", currencyPluralTitle: "Pontos", from: september },
    ]);
  });
});

describe("chain replay diffs", () => {
  it("rewrites awards for more than one colaborator", () => {
    const timestamp = new Date("2026-08-16T10:00:20.000Z");
    const previous = calculateChainRunCredits({
      currencyPerSecond: 2,
      members: [
        {
          documentId: "cut",
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
          subTaskId: "cut",
          timeSpentSeconds: 6,
          qty: 0,
        },
        {
          colaboratorId: "u2",
          subTaskId: "cut",
          timeSpentSeconds: 4,
          qty: 0,
        },
      ],
    });
    const next = calculateChainRunCredits({
      currencyPerSecond: 2,
      members: [
        {
          documentId: "cut",
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
          subTaskId: "cut",
          timeSpentSeconds: 4,
          qty: 0,
        },
        {
          colaboratorId: "u2",
          subTaskId: "cut",
          timeSpentSeconds: 6,
          qty: 0,
        },
      ],
    });
    expect(previous).toEqual([
      { colaboratorId: "u1", subTaskId: "cut", amount: 12 },
      { colaboratorId: "u2", subTaskId: "cut", amount: 8 },
    ]);
    expect(next).toEqual([
      { colaboratorId: "u1", subTaskId: "cut", amount: 8 },
      { colaboratorId: "u2", subTaskId: "cut", amount: 12 },
    ]);

    const adjustments = listAwardAdjustments(
      previous.map((row) => ({
        activityId: row.colaboratorId,
        colaboratorId: row.colaboratorId,
        timestamp,
        amount: row.amount,
      })),
      next.map((row) => ({
        activityId: row.colaboratorId,
        colaboratorId: row.colaboratorId,
        timestamp,
        amount: row.amount,
      })),
    );
    expect(adjustments).toEqual([
      { colaboratorId: "u1", timestamp, delta: -12 },
      { colaboratorId: "u2", timestamp, delta: -8 },
      { colaboratorId: "u1", timestamp, delta: 8 },
      { colaboratorId: "u2", timestamp, delta: 12 },
    ]);
  });
});
