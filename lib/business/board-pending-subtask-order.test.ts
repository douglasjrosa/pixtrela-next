import { describe, expect, it } from "vitest";

import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";
import {
  applyPreferredSubtaskOrder,
  findSubtaskReorderDependencyViolation,
  hasOrderDraftChanges,
  mergeOrderBaseline,
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

describe("findSubtaskReorderDependencyViolation", () => {
  const rows = [
    boardSubTaskSummaryStub({
      documentId: "b",
      name: "B",
      status: "waiting",
    }),
    boardSubTaskSummaryStub({
      documentId: "c",
      name: "C",
      status: "waiting",
      dependencyIds: ["b"],
    }),
  ];

  it("returns null when every consumer stays after its producer", () => {
    expect(findSubtaskReorderDependencyViolation(rows)).toBeNull();
  });

  it("flags a consumer placed before its producer", () => {
    expect(
      findSubtaskReorderDependencyViolation([rows[1]!, rows[0]!], "c"),
    ).toEqual({
      consumerName: "C",
      producerName: "B",
    });
  });

  it("ignores dependencies that are not in the ordered list", () => {
    expect(
      findSubtaskReorderDependencyViolation([
        boardSubTaskSummaryStub({
          documentId: "c",
          name: "C",
          status: "waiting",
          dependencyIds: ["outside"],
        }),
      ]),
    ).toBeNull();
  });
});

describe("hasOrderDraftChanges", () => {
  it("detects a changed document order", () => {
    const items = [
      boardSubTaskSummaryStub({ documentId: "b", name: "B", status: "waiting" }),
      boardSubTaskSummaryStub({ documentId: "a", name: "A", status: "waiting" }),
    ];
    expect(hasOrderDraftChanges(items, ["a", "b"])).toBe(true);
    expect(hasOrderDraftChanges(items, ["b", "a"])).toBe(false);
  });
});

describe("mergeOrderBaseline", () => {
  it("keeps the previous baseline and appends newly loaded ids", () => {
    expect(
      mergeOrderBaseline(["b", "a"], [
        { documentId: "a" },
        { documentId: "c" },
        { documentId: "b" },
      ]),
    ).toEqual(["b", "a", "c"]);
  });
});

describe("applyPreferredSubtaskOrder", () => {
  it("sorts by preferred ids and appends leftovers", () => {
    const items = [{ documentId: "a" }, { documentId: "b" }, { documentId: "c" }];
    expect(applyPreferredSubtaskOrder(items, ["c", "a"])).toEqual([
      { documentId: "c" },
      { documentId: "a" },
      { documentId: "b" },
    ]);
  });
});
