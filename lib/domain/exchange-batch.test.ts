import { describe, expect, it } from "vitest";

import {
  cycleYearMonth,
  isBatchVisible,
  maxActiveTeamLastDay,
  trimCartLinesForClose,
} from "./exchange-batch";

describe("cycleYearMonth", () => {
  it("reads UTC year and month", () => {
    expect(cycleYearMonth(new Date("2026-08-09T12:00:00Z"))).toEqual({
      year: 2026,
      month: 8,
    });
  });
});

describe("maxActiveTeamLastDay", () => {
  it("returns max last day among teams", () => {
    expect(
      maxActiveTeamLastDay([
        { exchangesLastDay: 10 },
        { exchangesLastDay: 15 },
        { exchangesLastDay: 12 },
      ]),
    ).toBe(15);
  });

  it("returns 0 when there are no teams", () => {
    expect(maxActiveTeamLastDay([])).toBe(0);
  });
});

describe("isBatchVisible", () => {
  it("is visible only after max last day", () => {
    expect(isBatchVisible(new Date("2026-08-15T12:00:00Z"), 15)).toBe(false);
    expect(isBatchVisible(new Date("2026-08-16T00:00:00Z"), 15)).toBe(true);
    expect(isBatchVisible(new Date("2026-08-16T00:00:00Z"), 0)).toBe(false);
  });

  it("does not mark batch visible on the capped last exchange day", () => {
    expect(isBatchVisible(new Date("2026-02-28T12:00:00Z"), 31)).toBe(false);
    expect(isBatchVisible(new Date("2026-04-30T12:00:00Z"), 31)).toBe(false);
  });
});

describe("trimCartLinesForClose", () => {
  it("clamps stock and drops expensive lines until affordable", () => {
    const trimmed = trimCartLinesForClose(
      [
        {
          awardId: "a",
          awardTitle: "Cheap",
          qty: 2,
          stock: 1,
          unitCost: 5,
          currencyId: "cur-1",
          currencyPluralTitle: "Stars",
        },
        {
          awardId: "b",
          awardTitle: "Pricey",
          qty: 1,
          stock: 5,
          unitCost: 20,
          currencyId: "cur-1",
          currencyPluralTitle: "Stars",
        },
      ],
      10,
    );
    expect(trimmed).toEqual([
      {
        awardId: "a",
        awardTitle: "Cheap",
        qty: 1,
        stock: 1,
        unitCost: 5,
        currencyId: "cur-1",
        currencyPluralTitle: "Stars",
      },
    ]);
  });

  it("partially keeps a line when balance allows fewer units", () => {
    const trimmed = trimCartLinesForClose(
      [
        {
          awardId: "a",
          awardTitle: "Item",
          qty: 5,
          stock: 5,
          unitCost: 3,
          currencyId: "cur-1",
          currencyPluralTitle: "Stars",
        },
      ],
      10,
    );
    expect(trimmed).toEqual([
      {
        awardId: "a",
        awardTitle: "Item",
        qty: 3,
        stock: 5,
        unitCost: 3,
        currencyId: "cur-1",
        currencyPluralTitle: "Stars",
      },
    ]);
  });

  it("returns empty when nothing is affordable", () => {
    expect(
      trimCartLinesForClose(
        [
          {
            awardId: "a",
            awardTitle: "Item",
            qty: 1,
            stock: 1,
            unitCost: 50,
            currencyId: "cur-1",
            currencyPluralTitle: "Stars",
          },
        ],
        10,
      ),
    ).toEqual([]);
  });
});
