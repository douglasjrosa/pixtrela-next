import { describe, expect, it } from "vitest";

import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";
import {
  reorderPendingSubtasksInPlace,
  subtaskDocumentIdsInOrder,
} from "@/lib/business/board-pending-subtask-order";

describe("reorderPendingSubtasksInPlace", () => {
  const subtasks = [
    boardSubTaskSummaryStub({
      documentId: "done",
      name: "Done",
      status: "finished",
    }),
    boardSubTaskSummaryStub({
      documentId: "a",
      name: "A",
      status: "waiting",
    }),
    boardSubTaskSummaryStub({
      documentId: "b",
      name: "B",
      status: "producing",
    }),
    boardSubTaskSummaryStub({
      documentId: "tail",
      name: "Tail",
      status: "finished",
    }),
  ];

  it("reorders only pending rows and preserves finished positions", () => {
    const result = reorderPendingSubtasksInPlace(subtasks, "b", "a");
    expect(result).not.toBeNull();
    expect(subtaskDocumentIdsInOrder(result!)).toEqual([
      "done",
      "b",
      "a",
      "tail",
    ]);
  });

  it("returns null when drag target is unchanged", () => {
    expect(reorderPendingSubtasksInPlace(subtasks, "a", "a")).toBeNull();
  });
});
