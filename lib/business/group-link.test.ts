import { describe, expect, it } from "vitest";

import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";
import {
  applyEffectiveBoardLinks,
  displayMaxSameTimeWorkers,
  formatQueueGroupLabel,
  groupMemberIds,
  prepareBoardSubtasksForSave,
  showChainLinkButton,
  toggleGroupInSelection,
} from "@/lib/business/group-link";

function row(
  documentId: string,
  index: number,
  sharingType: "qty" | "duration",
  linkedToPrevious: boolean,
  maxSameTimeWorkers = 1,
) {
  return {
    documentId,
    index,
    sharingType,
    linkedToPrevious,
    maxSameTimeWorkers,
  };
}

describe("showChainLinkButton", () => {
  const items = [
    row("a", 0, "duration", false),
    row("b", 1, "qty", false),
    row("c", 2, "qty", true),
  ];

  it("hides the control when sharing types differ", () => {
    expect(showChainLinkButton(items[1]!, items)).toBe(false);
  });

  it("hides unlink when a stored link mixes sharing types", () => {
    const mixed = [
      row("a", 0, "duration", false),
      row("b", 1, "qty", true),
    ];
    expect(showChainLinkButton(mixed[1]!, mixed)).toBe(false);
  });

  it("shows the control when the previous row has the same sharing type", () => {
    expect(showChainLinkButton(items[2]!, items)).toBe(true);
  });
});

describe("applyEffectiveBoardLinks", () => {
  it("treats a mixed link as unlinked", () => {
    const [first, second] = applyEffectiveBoardLinks([
      row("a", 0, "duration", false),
      row("b", 1, "qty", true),
    ]);
    expect(first?.linkedToPrevious).toBe(false);
    expect(second?.linkedToPrevious).toBe(false);
  });
});

describe("displayMaxSameTimeWorkers", () => {
  it("shows the highest stored capacity on every linked member", () => {
    const maxById = displayMaxSameTimeWorkers([
      row("a", 0, "duration", false, 1),
      row("b", 1, "duration", true, 3),
      row("c", 2, "duration", true, 2),
    ]);
    expect(maxById.get("a")).toBe(3);
    expect(maxById.get("b")).toBe(3);
    expect(maxById.get("c")).toBe(3);
  });

  it("keeps each row's own capacity when the link is mixed", () => {
    const maxById = displayMaxSameTimeWorkers([
      row("a", 0, "duration", false, 1),
      row("b", 1, "qty", true, 4),
    ]);
    expect(maxById.get("a")).toBe(1);
    expect(maxById.get("b")).toBe(4);
  });
});

describe("group selection", () => {
  const items = [
    row("a", 0, "duration", false),
    row("b", 1, "duration", true),
    row("c", 2, "duration", false),
  ];

  it("selects every member of a linked group together", () => {
    expect(groupMemberIds(items, "b")).toEqual(["a", "b"]);
    expect(toggleGroupInSelection([], ["a", "b"])).toEqual(["a", "b"]);
    expect(toggleGroupInSelection(["a", "b", "c"], ["a", "b"])).toEqual(["c"]);
  });
});

describe("prepareBoardSubtasksForSave", () => {
  it("unlinks mixed sharing types and keeps each row's assignees", () => {
    const saved = prepareBoardSubtasksForSave([
      boardSubTaskSummaryStub({
        documentId: "a",
        index: 0,
        sharingType: "duration",
        linkedToPrevious: false,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "b",
        index: 1,
        sharingType: "qty",
        linkedToPrevious: true,
        assignedTo: [{ documentId: "u-2", name: "Bob" }],
      }),
    ]);
    expect(saved[1]?.linkedToPrevious).toBe(false);
    expect(saved[1]?.assignedTo.map((item) => item.documentId)).toEqual(["u-2"]);
  });

  it("copies the head assignees onto every valid member", () => {
    const saved = prepareBoardSubtasksForSave([
      boardSubTaskSummaryStub({
        documentId: "a",
        index: 0,
        sharingType: "duration",
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "b",
        index: 1,
        sharingType: "duration",
        linkedToPrevious: true,
        assignedTo: [{ documentId: "u-2", name: "Bob" }],
      }),
    ]);
    expect(saved[1]?.assignedTo.map((item) => item.documentId)).toEqual(["u-1"]);
  });

  it("copies the highest maxSameTimeWorkers onto every valid member", () => {
    const saved = prepareBoardSubtasksForSave([
      boardSubTaskSummaryStub({
        documentId: "a",
        index: 0,
        sharingType: "duration",
        maxSameTimeWorkers: 1,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "b",
        index: 1,
        sharingType: "duration",
        linkedToPrevious: true,
        maxSameTimeWorkers: 2,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
    ]);
    expect(saved[0]?.maxSameTimeWorkers).toBe(2);
    expect(saved[1]?.maxSameTimeWorkers).toBe(2);
  });
});

describe("formatQueueGroupLabel", () => {
  it("appends the count of the other members", () => {
    expect(formatQueueGroupLabel("Cortar", 2)).toBe("Cortar +2");
    expect(formatQueueGroupLabel("Cortar", 0)).toBe("Cortar");
  });
});
