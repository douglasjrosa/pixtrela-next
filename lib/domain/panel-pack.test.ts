import { describe, expect, it } from "vitest";

import {
  crewDaysForTask,
  findNextBusinessDate,
  isPanelTaskEligible,
  packPanelTasks,
  remainingEffortSeconds,
  usableTodaySeconds,
  type PanelTaskInput,
} from "./panel-pack";
import type { ProductiveWindow } from "./workday-coverage";

const HOUR_MS = 3_600_000;
const DAY_START = Date.parse("2026-11-24T08:00:00.000Z");
const EIGHT_HOURS_MS = 8 * HOUR_MS;
const DAY_END = DAY_START + EIGHT_HOURS_MS;

function shift(startHour: number, endHour: number): ProductiveWindow[] {
  return [
    {
      startMs: DAY_START + startHour * HOUR_MS,
      endMs: DAY_START + endHour * HOUR_MS,
    },
  ];
}

function subTask(input: {
  id: string;
  assignees: string[];
  max?: number;
  expectedTime: number;
  sharingType?: "qty" | "duration";
  targetQty?: number;
  completedQty?: number;
  timeSpent?: number;
}) {
  return {
    id: input.id,
    assigneeIds: input.assignees,
    maxSameTimeWorkers: input.max ?? 1,
    sharingType: input.sharingType ?? "duration",
    expectedTime: input.expectedTime,
    targetQty: input.targetQty ?? 1,
    completedQty: input.completedQty ?? 0,
    timeSpent: input.timeSpent ?? 0,
  };
}

describe("remainingEffortSeconds", () => {
  it("uses leftover duration", () => {
    expect(
      remainingEffortSeconds({
        sharingType: "duration",
        expectedTime: 100,
        targetQty: 1,
        completedQty: 0,
        timeSpent: 40,
      }),
    ).toBe(60);
  });

  it("scales leftover qty by time per piece", () => {
    expect(
      remainingEffortSeconds({
        sharingType: "qty",
        expectedTime: 100,
        targetQty: 10,
        completedQty: 4,
        timeSpent: 0,
      }),
    ).toBe(60);
  });
});

describe("usableTodaySeconds", () => {
  const fullShift = shift(0, 8);

  it("counts two overlapping workers when max is 2", () => {
    expect(
      usableTodaySeconds({
        assigneeWindows: [fullShift, fullShift],
        maxSameTimeWorkers: 2,
        rangeStartMs: DAY_START,
        rangeEndMs: DAY_END,
      }),
    ).toBe(16 * 3600);
  });

  it("caps overlapping workers at maxSameTimeWorkers", () => {
    expect(
      usableTodaySeconds({
        assigneeWindows: [fullShift, fullShift],
        maxSameTimeWorkers: 1,
        rangeStartMs: DAY_START,
        rangeEndMs: DAY_END,
      }),
    ).toBe(8 * 3600);
  });

  it("adds staggered non-overlapping shifts", () => {
    expect(
      usableTodaySeconds({
        assigneeWindows: [shift(0, 8), shift(8, 16)],
        maxSameTimeWorkers: 2,
        rangeStartMs: DAY_START,
        rangeEndMs: DAY_START + 16 * HOUR_MS,
      }),
    ).toBe(16 * 3600);
  });

  it("does not count a third overlapping worker above max 2", () => {
    expect(
      usableTodaySeconds({
        assigneeWindows: [fullShift, fullShift, fullShift],
        maxSameTimeWorkers: 2,
        rangeStartMs: DAY_START,
        rangeEndMs: DAY_END,
      }),
    ).toBe(16 * 3600);
  });
});

describe("eligibility and packing", () => {
  const labor = new Map<string, ProductiveWindow[]>([
    ["ana", shift(0, 8)],
    ["bruno", shift(0, 8)],
  ]);

  it("drops a task when any subtask has no assignee", () => {
    const task: PanelTaskInput = {
      id: "t1",
      subTasks: [
        subTask({ id: "s1", assignees: ["ana"], expectedTime: 3600 }),
        subTask({ id: "s2", assignees: [], expectedTime: 3600 }),
      ],
    };
    expect(isPanelTaskEligible(task)).toBe(false);
    const packed = packPanelTasks([task], labor, DAY_START, DAY_END);
    expect(packed.ineligibleIds).toEqual(["t1"]);
    expect(packed.today).toEqual([]);
  });

  it("keeps sequential cost as the sum of crew-days", () => {
    const task: PanelTaskInput = {
      id: "t1",
      subTasks: [
        subTask({
          id: "s1",
          assignees: ["ana", "bruno"],
          max: 2,
          expectedTime: 8 * 3600,
        }),
        subTask({
          id: "s2",
          assignees: ["ana", "bruno"],
          max: 2,
          expectedTime: 8 * 3600,
        }),
      ],
    };
    const { days } = crewDaysForTask(task, labor, DAY_START, DAY_END);
    expect(days).toBe(1);
  });

  it("puts the first overrun task in today and the rest tomorrow", () => {
    const small: PanelTaskInput = {
      id: "small",
      subTasks: [
        subTask({
          id: "s-small",
          assignees: ["ana", "bruno"],
          max: 2,
          expectedTime: 4 * 3600,
        }),
      ],
    };
    const huge: PanelTaskInput = {
      id: "huge",
      subTasks: [
        subTask({
          id: "s-huge",
          assignees: ["ana"],
          max: 1,
          expectedTime: 16 * 3600,
        }),
      ],
    };
    const later: PanelTaskInput = {
      id: "later",
      subTasks: [
        subTask({
          id: "s-later",
          assignees: ["ana"],
          max: 1,
          expectedTime: 3600,
        }),
      ],
    };
    const packed = packPanelTasks(
      [small, huge, later],
      labor,
      DAY_START,
      DAY_END,
    );
    expect(packed.today.map((row) => row.id)).toEqual(["small", "huge"]);
    expect(packed.overrunTaskId).toBe("huge");
    expect(packed.tomorrow.map((row) => row.id)).toEqual(["later"]);
  });
});

describe("findNextBusinessDate", () => {
  it("skips days without labor", () => {
    expect(
      findNextBusinessDate("2026-11-24", (iso) => iso === "2026-11-26"),
    ).toBe("2026-11-26");
  });

  it("returns null when lookahead is empty", () => {
    expect(findNextBusinessDate("2026-11-24", () => false, 2)).toBeNull();
  });
});
