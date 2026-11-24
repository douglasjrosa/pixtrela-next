import { describe, expect, it } from "vitest";

import type { WorkdayCoverageRule } from "./workday-coverage";
import {
  assignWorkdayRulesToUsers,
  civilDayRangeMs,
  createSessionSecondsMeasurer,
  PRODUCTIVE_TIMER_HORIZON_DAYS,
  productiveSecondsBetween,
  productiveSecondsFromWindows,
  resolveProductiveWindows,
  resolveWorkdayActionGate,
  timerHorizonEnd,
} from "./workday-coverage";

const FRIDAY = new Date("2026-06-05T00:00:00.000Z");

function atUtc(hours: number, minutes = 0, dayOffset = 0): Date {
  return new Date(
    Date.UTC(
      2026,
      5,
      5 + dayOffset,
      hours,
      minutes,
      0,
      0,
    ),
  );
}

function weekSlots(
  startMinute: number,
  endMinute: number,
): WorkdayCoverageRule["slots"] {
  return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    isRecurrent: true,
    dayOfWeek,
    date: null,
    startMinute,
    endMinute,
  }));
}

function rule(
  overrides: Partial<WorkdayCoverageRule> & {
    startMinute?: number;
    endMinute?: number;
  } = {},
): WorkdayCoverageRule {
  const {
    startMinute = 8 * 60,
    endMinute = 17 * 60,
    slots,
    ...rest
  } = overrides;
  return {
    scope: "global",
    action: "work",
    timezone: "UTC",
    validFrom: null,
    validUntil: null,
    active: true,
    slots: slots ?? weekSlots(startMinute, endMinute),
    ...rest,
  };
}

describe("productiveSecondsBetween", () => {
  it("returns 0 without a matching work rule", () => {
    expect(productiveSecondsBetween(atUtc(8), atUtc(12), [])).toBe(0);
  });

  it("returns 0 when only off rules cover the session", () => {
    expect(
      productiveSecondsBetween(atUtc(8), atUtc(12), [
        rule({ action: "off", startMinute: 0, endMinute: 1440 }),
      ]),
    ).toBe(0);
  });

  it("keeps only the 08:00-17:00 window and drops overnight hours", () => {
    expect(
      productiveSecondsBetween(atUtc(7), atUtc(18), [rule()]),
    ).toBe(9 * 3600);
  });

  it("credits each side of a midnight-spanning session", () => {
    const startedAt = atUtc(16);
    const endedAt = atUtc(9, 0, 1);
    expect(productiveSecondsBetween(startedAt, endedAt, [rule()])).toBe(
      2 * 3600,
    );
  });

  it("lets a user lunch off cut global work without erasing the afternoon", () => {
    const seconds = productiveSecondsBetween(atUtc(8), atUtc(17), [
      rule(),
      rule({
        scope: "user",
        action: "off",
        startMinute: 12 * 60,
        endMinute: 13 * 60,
      }),
    ]);
    expect(seconds).toBe(8 * 3600);
  });

  it("keeps the factory afternoon when a user shift ends at 14:00", () => {
    const seconds = productiveSecondsBetween(atUtc(6), atUtc(17), [
      rule(),
      rule({
        scope: "user",
        startMinute: 6 * 60,
        endMinute: 14 * 60,
      }),
    ]);
    expect(seconds).toBe(11 * 3600);
  });

  it("lets a specific date beat recurrent only where they overlap", () => {
    const seconds = productiveSecondsBetween(atUtc(8), atUtc(17), [
      rule(),
      {
        scope: "global",
        action: "off",
        timezone: "UTC",
        validFrom: null,
        validUntil: null,
        active: true,
        slots: [
          {
            isRecurrent: false,
            dayOfWeek: null,
            date: "2026-06-05",
            startMinute: 8 * 60,
            endMinute: 12 * 60,
          },
        ],
      },
    ]);
    expect(seconds).toBe(5 * 3600);
  });

  it("lets user overtime count on a global holiday", () => {
    const seconds = productiveSecondsBetween(atUtc(8), atUtc(12), [
      rule({ action: "holiday", startMinute: 0, endMinute: 1440 }),
      rule({
        scope: "user",
        action: "overtime",
        startMinute: 8 * 60,
        endMinute: 12 * 60,
      }),
    ]);
    expect(seconds).toBe(4 * 3600);
  });

  it("lets a global holiday beat a user work scale", () => {
    const seconds = productiveSecondsBetween(atUtc(8), atUtc(12), [
      rule({ action: "holiday", startMinute: 0, endMinute: 1440 }),
      rule({
        scope: "user",
        action: "work",
        startMinute: 8 * 60,
        endMinute: 17 * 60,
      }),
    ]);
    expect(seconds).toBe(0);
  });

  it("lets team off beat team work at the same instant", () => {
    const seconds = productiveSecondsBetween(atUtc(8), atUtc(12), [
      rule({ scope: "team" }),
      rule({
        scope: "team",
        action: "off",
        startMinute: 8 * 60,
        endMinute: 12 * 60,
      }),
    ]);
    expect(seconds).toBe(0);
  });

  it("sums disjoint team work windows", () => {
    const seconds = productiveSecondsBetween(atUtc(6), atUtc(18), [
      rule({
        scope: "team",
        startMinute: 6 * 60,
        endMinute: 10 * 60,
      }),
      rule({
        scope: "team",
        startMinute: 14 * 60,
        endMinute: 18 * 60,
      }),
    ]);
    expect(seconds).toBe(8 * 3600);
  });

  it("ignores a rule outside validFrom and validUntil", () => {
    expect(
      productiveSecondsBetween(atUtc(8), atUtc(12), [
        rule({ validFrom: "2026-07-01", validUntil: "2026-07-31" }),
      ]),
    ).toBe(0);
  });

  it("ignores inactive rules", () => {
    expect(
      productiveSecondsBetween(atUtc(8), atUtc(12), [rule({ active: false })]),
    ).toBe(0);
  });

  it("converts America/Sao_Paulo 08:00 to 11:00 UTC", () => {
    const startedAt = new Date("2026-06-05T11:00:00.000Z");
    const endedAt = new Date("2026-06-05T20:00:00.000Z");
    expect(
      productiveSecondsBetween(startedAt, endedAt, [
        rule({ timezone: "America/Sao_Paulo" }),
      ]),
    ).toBe(9 * 3600);
  });

  it("floors the summed milliseconds instead of summing floors", () => {
    const startedAt = new Date("2026-06-05T08:00:00.400Z");
    const endedAt = new Date("2026-06-05T08:00:01.800Z");
    expect(productiveSecondsBetween(startedAt, endedAt, [rule()])).toBe(1);
  });
});

describe("resolveProductiveWindows", () => {
  it("merges adjacent work slices", () => {
    const windows = resolveProductiveWindows(atUtc(8), atUtc(12), [rule()]);
    expect(windows).toEqual([
      { startMs: atUtc(8).getTime(), endMs: atUtc(12).getTime() },
    ]);
  });
});

describe("civilDayRangeMs", () => {
  it("uses America/Sao_Paulo midnight bounds", () => {
    const range = civilDayRangeMs("2026-11-24", "America/Sao_Paulo");
    expect(new Date(range.startMs).toISOString()).toBe(
      "2026-11-24T03:00:00.000Z",
    );
    expect(new Date(range.endMs).toISOString()).toBe(
      "2026-11-25T03:00:00.000Z",
    );
  });
});

describe("productiveSecondsFromWindows", () => {
  it("intersects the session with resolved windows", () => {
    const windows = resolveProductiveWindows(atUtc(8), atUtc(17), [rule()]);
    expect(
      productiveSecondsFromWindows(
        atUtc(12).getTime(),
        atUtc(18).getTime(),
        windows,
      ),
    ).toBe(5 * 3600);
  });
});

describe("createSessionSecondsMeasurer", () => {
  it("returns 0 for a user with no rules", () => {
    const measure = createSessionSecondsMeasurer(new Map());
    expect(measure(atUtc(8), atUtc(12), "u1")).toBe(0);
  });

  it("uses that user's rules", () => {
    const measure = createSessionSecondsMeasurer(
      new Map([["u1", [rule()]]]),
    );
    expect(measure(atUtc(8), atUtc(12), "u1")).toBe(4 * 3600);
    expect(measure(atUtc(8), atUtc(12), "u2")).toBe(0);
  });
});

describe("assignWorkdayRulesToUsers", () => {
  it("attaches global, matching team, and matching user rules", () => {
    const assigned = assignWorkdayRulesToUsers(
      ["u1", "u2"],
      new Map([
        ["u1", ["t1"]],
        ["u2", ["t2"]],
      ]),
      [
        { ...rule(), teamIds: [], userIds: [] },
        {
          ...rule({ scope: "team", startMinute: 6 * 60, endMinute: 8 * 60 }),
          teamIds: ["t1"],
          userIds: [],
        },
        {
          ...rule({ scope: "user", startMinute: 18 * 60, endMinute: 20 * 60 }),
          teamIds: [],
          userIds: ["u2"],
        },
      ],
    );
    expect(assigned.get("u1")).toHaveLength(2);
    expect(assigned.get("u2")).toHaveLength(2);
    expect(assigned.get("u2")?.some((row) => row.scope === "user")).toBe(true);
  });
});

describe("resolveWorkdayActionGate", () => {
  it("allows actions inside a work window", () => {
    expect(resolveWorkdayActionGate(atUtc(8), [rule()]).allowed).toBe(true);
  });

  it("blocks actions before the next work window and reports that start", () => {
    const gate = resolveWorkdayActionGate(atUtc(7), [rule()]);
    expect(gate.allowed).toBe(false);
    expect(gate.nextStartAt?.toISOString()).toBe(atUtc(8).toISOString());
  });

  it("blocks actions with no resume when no work rule exists", () => {
    expect(resolveWorkdayActionGate(atUtc(8), [])).toEqual({
      allowed: false,
      nextStartAt: null,
    });
  });
});

describe("timerHorizonEnd", () => {
  it("extends now by the live timer horizon", () => {
    const end = timerHorizonEnd(FRIDAY);
    expect(end.getTime() - FRIDAY.getTime()).toBe(
      PRODUCTIVE_TIMER_HORIZON_DAYS * 86_400_000,
    );
  });
});
