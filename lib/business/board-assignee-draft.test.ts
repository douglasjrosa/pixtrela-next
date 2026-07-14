import { describe, expect, it } from "vitest";

import type { BoardSubTaskSummary } from "@/components/kanban/types";
import {
  assigneeIdsKey,
  buildAssigneesSnapshot,
  collectDirtyAssigneeUpdates,
  hasAssigneeDraftChanges,
  mergeAssigneesBaseline,
  mergeLoadedSubtasksWithDraft,
  resolveAssigneeNames,
} from "./board-assignee-draft";

const subtasks: BoardSubTaskSummary[] = [
  {
    documentId: "st-1",
    name: "Soldar",
    status: "waiting",
    assignedTo: [{ documentId: "u-2", name: "Bia" }, { documentId: "u-1", name: "Ana" }],
  },
  {
    documentId: "st-2",
    name: "Pintar",
    status: "producing",
    assignedTo: [],
  },
];

describe("board-assignee-draft", () => {
  it("builds a stable assignee snapshot keyed by sorted ids", () => {
    expect(assigneeIdsKey(["u-2", "u-1"])).toBe("u-1,u-2");
    expect(buildAssigneesSnapshot(subtasks)).toEqual({
      "st-1": "u-1,u-2",
      "st-2": "",
    });
  });

  it("collects only dirty assignee updates", () => {
    const baseline = buildAssigneesSnapshot(subtasks);
    const draft: BoardSubTaskSummary[] = [
      {
        ...subtasks[0]!,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      },
      subtasks[1]!,
    ];

    expect(collectDirtyAssigneeUpdates(draft, baseline)).toEqual([
      { documentId: "st-1", assignedToIds: ["u-1"] },
    ]);
    expect(hasAssigneeDraftChanges(draft, baseline)).toBe(true);
    expect(hasAssigneeDraftChanges(subtasks, baseline)).toBe(false);
  });

  it("resolves assignee names from teams", () => {
    expect(
      resolveAssigneeNames(
        [
          {
            documentId: "t1",
            name: "Equipe",
            members: [{ documentId: "u-1", name: "Ana" }],
          },
        ],
        ["u-1", "missing"],
      ),
    ).toEqual([
      { documentId: "u-1", name: "Ana" },
      { documentId: "missing", name: "missing" },
    ]);
  });

  it("keeps draft assignees when merging loaded subtasks", () => {
    const loaded: BoardSubTaskSummary[] = [
      {
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      },
      {
        documentId: "st-3",
        name: "Nova",
        status: "waiting",
        assignedTo: [],
      },
    ];
    const draft: BoardSubTaskSummary[] = [
      {
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      },
    ];

    expect(mergeLoadedSubtasksWithDraft(loaded, draft)).toEqual([
      {
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      },
      loaded[1],
    ]);
  });

  it("merges baseline keys for kept and newly loaded subtasks", () => {
    expect(
      mergeAssigneesBaseline(
        { "st-1": "u-1", "st-gone": "u-9" },
        [
          {
            documentId: "st-1",
            name: "Soldar",
            status: "waiting",
            assignedTo: [{ documentId: "u-2", name: "Bia" }],
          },
          {
            documentId: "st-3",
            name: "Nova",
            status: "waiting",
            assignedTo: [],
          },
        ],
      ),
    ).toEqual({
      "st-1": "u-1",
      "st-3": "",
    });
  });
});
