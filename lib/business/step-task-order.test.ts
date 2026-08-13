import { describe, expect, it } from "vitest";

import {
  compareTasksForStepOrder,
  computeGlobalTaskIndexUpdates,
  sortTasksInStep,
  type StepTaskOrderItem,
} from "@/lib/business/step-task-order";

const baseDate = new Date("2026-01-01T10:00:00.000Z");

function task(
  id: string,
  stepId: string,
  index: number,
  deliveryDate: string | null,
  createdAt: Date,
): StepTaskOrderItem {
  return { id, stepId, index, deliveryDate, createdAt };
}

describe("sortTasksInStep", () => {
  it("sorts by delivery date ascending with nulls last", () => {
    const items = [
      task("a", "s1", 0, "2026-02-01", baseDate),
      task("b", "s1", 1, null, baseDate),
      task("c", "s1", 2, "2026-01-01", baseDate),
    ];

    expect(
      sortTasksInStep(items, "delivery_date_asc").map((item) => item.id),
    ).toEqual(["c", "a", "b"]);
  });

  it("sorts by created date descending", () => {
    const items = [
      task("a", "s1", 0, null, new Date("2026-01-01T10:00:00.000Z")),
      task("b", "s1", 1, null, new Date("2026-01-02T10:00:00.000Z")),
    ];

    expect(
      sortTasksInStep(items, "created_at_desc").map((item) => item.id),
    ).toEqual(["b", "a"]);
  });
});

describe("computeGlobalTaskIndexUpdates", () => {
  it("reindexes only auto-sorted steps and preserves manual order elsewhere", () => {
    const allTasks = [
      task("t1", "s1", 5, "2026-02-01", baseDate),
      task("t2", "s1", 2, "2026-01-01", baseDate),
      task("t3", "s2", 0, null, baseDate),
      task("t4", "s2", 1, null, baseDate),
    ];
    const steps = [
      { id: "s1", index: 0, taskOrderBy: "delivery_date_asc" as const },
      { id: "s2", index: 1, taskOrderBy: "manual" as const },
    ];

    const updates = computeGlobalTaskIndexUpdates(
      allTasks,
      steps,
      new Set(["s1"]),
    );

    expect(updates).toEqual(
      expect.arrayContaining([
        { id: "t2", index: 0 },
        { id: "t1", index: 1 },
        { id: "t3", index: 2 },
        { id: "t4", index: 3 },
      ]),
    );
    expect(updates).toHaveLength(4);
  });
});

describe("compareTasksForStepOrder", () => {
  it("keeps manual order by persisted index", () => {
    const left = task("a", "s1", 1, null, baseDate);
    const right = task("b", "s1", 0, null, baseDate);
    expect(compareTasksForStepOrder(left, right, "manual")).toBeGreaterThan(0);
  });
});
