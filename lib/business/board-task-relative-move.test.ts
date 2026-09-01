import { describe, expect, it } from "vitest";

import {
  toKanbanColumnId,
  toKanbanTaskId,
} from "@/lib/business/kanban-task-order";
import { resolveBoardTaskRelativeMove } from "./board-task-relative-move";

const tasks = [
  { id: 1, documentId: "a", stepId: 0 },
  { id: 2, documentId: "b", stepId: 0 },
  { id: 3, documentId: "c", stepId: 1 },
];

describe("resolveBoardTaskRelativeMove", () => {
  it("resolves drop on a card as before the anchor", () => {
    expect(
      resolveBoardTaskRelativeMove(
        tasks,
        toKanbanTaskId(1),
        toKanbanTaskId(2),
      ),
    ).toEqual({
      taskDocumentId: "a",
      targetStepKanbanId: 0,
      placement: { kind: "before", anchorDocumentId: "b" },
    });
  });

  it("resolves drop on a column as end", () => {
    expect(
      resolveBoardTaskRelativeMove(
        tasks,
        toKanbanTaskId(1),
        toKanbanColumnId(1),
      ),
    ).toEqual({
      taskDocumentId: "a",
      targetStepKanbanId: 1,
      placement: { kind: "end" },
    });
  });

  it("returns null when dropping on itself", () => {
    expect(
      resolveBoardTaskRelativeMove(
        tasks,
        toKanbanTaskId(1),
        toKanbanTaskId(1),
      ),
    ).toBeNull();
  });
});
