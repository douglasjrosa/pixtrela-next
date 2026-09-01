import { describe, expect, it } from "vitest";

import {
  buildStepKanbanLookup,
  mapStepsToKanbanSteps,
} from "@/lib/board/kanban-drizzle-ids";

describe("kanban-drizzle-ids", () => {
  it("assigns unique sequential kanban ids when step indexes collide", () => {
    const rows = [
      {
        id: "uuid-b",
        name: "B",
        index: 0,
        taskOrderBy: "manual" as const,
        tasksPerLoad: 10,
      },
      {
        id: "uuid-a",
        name: "A",
        index: 0,
        taskOrderBy: "manual" as const,
        tasksPerLoad: 15,
      },
    ];

    const steps = mapStepsToKanbanSteps(rows);
    expect(steps.map((step) => step.id)).toEqual([0, 1]);
    expect(steps.map((step) => step.documentId)).toEqual(["uuid-a", "uuid-b"]);
    expect(steps.map((step) => step.tasksPerLoad)).toEqual([15, 10]);

    const lookup = buildStepKanbanLookup(rows);
    expect(lookup.kanbanIdByStepUuid.get("uuid-a")).toBe(0);
    expect(lookup.kanbanIdByStepUuid.get("uuid-b")).toBe(1);
    expect(lookup.stepUuidByKanbanId.get(0)).toBe("uuid-a");
    expect(lookup.stepUuidByKanbanId.get(1)).toBe("uuid-b");
  });
});
