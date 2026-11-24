import { describe, expect, it } from "vitest";

import {
  isImmediateNextDate,
  isPanelTaskFulfilled,
  projectFrozenPanelView,
  weekdayKeyFromIsoDate,
  type LivePanelTask,
} from "./project-panel-tv";

function task(input: Partial<LivePanelTask> & { id: string }): LivePanelTask {
  return {
    name: input.name ?? input.id,
    status: input.status ?? "waiting",
    stepId: input.stepId ?? "step-1",
    subTasks: input.subTasks ?? [
      { id: `${input.id}-a`, status: "waiting", active: true },
      { id: `${input.id}-b`, status: "finished", active: true },
    ],
    ...input,
  };
}

describe("isPanelTaskFulfilled", () => {
  it("counts a missing task as fulfilled", () => {
    expect(isPanelTaskFulfilled(undefined, "step-1")).toBe(true);
  });

  it("counts a task that left the panel step", () => {
    expect(
      isPanelTaskFulfilled(task({ id: "t1", stepId: "other" }), "step-1"),
    ).toBe(true);
  });

  it("counts finished status on the panel step", () => {
    expect(
      isPanelTaskFulfilled(task({ id: "t1", status: "finished" }), "step-1"),
    ).toBe(true);
  });
});

describe("projectFrozenPanelView", () => {
  it("hides done Today cards and keeps Tomorrow in place", () => {
    const tasksById = new Map<string, LivePanelTask>([
      ["today-done", task({ id: "today-done", status: "finished" })],
      ["today-live", task({ id: "today-live", status: "producing" })],
      ["tomorrow", task({ id: "tomorrow", status: "waiting" })],
    ]);

    const view = projectFrozenPanelView({
      todayIds: ["today-done", "today-live"],
      tomorrowIds: ["tomorrow"],
      overrunTaskId: "today-live",
      panelStepId: "step-1",
      tasksById,
    });

    expect(view.today.map((card) => card.id)).toEqual(["today-live"]);
    expect(view.today[0]?.overrun).toBe(true);
    expect(view.today[0]?.producing).toBe(true);
    expect(view.today[0]?.completedSubTasks).toBe(1);
    expect(view.today[0]?.totalSubTasks).toBe(2);
    expect(view.tomorrow.map((card) => card.id)).toEqual(["tomorrow"]);
    expect(view.completedTodayCount).toBe(1);
  });
});

describe("calendar helpers", () => {
  it("detects the next civil date", () => {
    expect(isImmediateNextDate("2026-11-24", "2026-11-25")).toBe(true);
    expect(isImmediateNextDate("2026-11-24", "2026-11-26")).toBe(false);
  });

  it("maps ISO dates to weekday keys in UTC", () => {
    expect(weekdayKeyFromIsoDate("2026-11-24")).toBe("tuesday");
  });
});
