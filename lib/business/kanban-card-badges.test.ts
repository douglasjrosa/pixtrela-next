import { describe, expect, it } from "vitest";

import {
  countOpenColaborators,
  countUniqueColaboratorIds,
  countUnassignedSubTasks,
} from "./kanban-card-badges";

describe("countOpenColaborators", () => {
  it("counts unique colaborators with open sessions", () => {
    expect(
      countOpenColaborators([
        {
          subTaskDocumentId: "st-1",
          colaboratorDocumentId: "u-1",
          action: "started",
          timestamp: "2026-07-16T10:00:00.000Z",
        },
        {
          subTaskDocumentId: "st-2",
          colaboratorDocumentId: "u-1",
          action: "started",
          timestamp: "2026-07-16T10:01:00.000Z",
        },
        {
          subTaskDocumentId: "st-1",
          colaboratorDocumentId: "u-2",
          action: "started",
          timestamp: "2026-07-16T10:02:00.000Z",
        },
      ]),
    ).toBe(2);
  });

  it("ignores closed sessions", () => {
    expect(
      countOpenColaborators([
        {
          subTaskDocumentId: "st-1",
          colaboratorDocumentId: "u-1",
          action: "started",
          timestamp: "2026-07-16T10:00:00.000Z",
        },
        {
          subTaskDocumentId: "st-1",
          colaboratorDocumentId: "u-1",
          action: "stoped",
          timestamp: "2026-07-16T10:05:00.000Z",
        },
        {
          subTaskDocumentId: "st-1",
          colaboratorDocumentId: "u-2",
          action: "started",
          timestamp: "2026-07-16T11:00:00.000Z",
        },
      ]),
    ).toBe(1);
  });
});

describe("countUniqueColaboratorIds", () => {
  it("counts unique ids and ignores duplicates", () => {
    expect(countUniqueColaboratorIds(["u-1", "u-2", "u-1"])).toBe(2);
  });

  it("returns 0 for an empty list", () => {
    expect(countUniqueColaboratorIds([])).toBe(0);
  });
});

describe("countUnassignedSubTasks", () => {
  it("counts only sub-tasks with zero assignees", () => {
    expect(
      countUnassignedSubTasks([
        { assignedCount: 0 },
        { assignedCount: 2 },
        { assignedCount: 0 },
      ]),
    ).toBe(2);
  });

  it("returns 0 when every sub-task has assignees", () => {
    expect(countUnassignedSubTasks([{ assignedCount: 1 }])).toBe(0);
  });
});
