import { describe, expect, it } from "vitest";

import {
  applySequentialSubTaskIndices,
  buildSubTaskIndexUpdates,
  getNextSubTaskIndex,
  moveSubTaskInOrder,
  reorderSubTasksByDrag,
  subTaskDisplayPosition,
} from "./subtask-order";

describe("getNextSubTaskIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(getNextSubTaskIndex([])).toBe(0);
  });

  it("returns max index plus one", () => {
    expect(getNextSubTaskIndex([{ index: 0 }, { index: 2 }])).toBe(3);
  });
});

describe("subTaskDisplayPosition", () => {
  it("returns 1-based row position", () => {
    expect(subTaskDisplayPosition(0)).toBe(1);
    expect(subTaskDisplayPosition(2)).toBe(3);
  });
});

describe("buildSubTaskIndexUpdates", () => {
  it("assigns sequential 0-based indexes", () => {
    expect(buildSubTaskIndexUpdates(["c", "a", "b"])).toEqual([
      { documentId: "c", index: 0 },
      { documentId: "a", index: 1 },
      { documentId: "b", index: 2 },
    ]);
  });
});

describe("moveSubTaskInOrder", () => {
  const items = [
    { documentId: "a", name: "A" },
    { documentId: "b", name: "B" },
    { documentId: "c", name: "C" },
  ];

  it("moves an item to a new position", () => {
    expect(moveSubTaskInOrder(items, "a", "c")?.map((item) => item.documentId)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("returns null when ids are equal or unknown", () => {
    expect(moveSubTaskInOrder(items, "a", "a")).toBeNull();
    expect(moveSubTaskInOrder(items, "a", "missing")).toBeNull();
  });
});

describe("applySequentialSubTaskIndices", () => {
  it("assigns 0-based indexes in list order", () => {
    expect(
      applySequentialSubTaskIndices([
        { documentId: "c", index: 5 },
        { documentId: "a", index: 0 },
      ]),
    ).toEqual([
      { documentId: "c", index: 0 },
      { documentId: "a", index: 1 },
    ]);
  });
});

describe("reorderSubTasksByDrag", () => {
  const items = [
    { documentId: "a", index: 0 },
    { documentId: "b", index: 1 },
    { documentId: "c", index: 2 },
    { documentId: "d", index: 3 },
    { documentId: "e", index: 4 },
  ];

  it("moves row 2 to position 4 and shifts affected rows", () => {
    expect(reorderSubTasksByDrag(items, "b", "d")).toEqual([
      { documentId: "a", index: 0 },
      { documentId: "c", index: 1 },
      { documentId: "d", index: 2 },
      { documentId: "b", index: 3 },
      { documentId: "e", index: 4 },
    ]);
  });

  it("moves row 4 to position 2 and shifts affected rows", () => {
    expect(reorderSubTasksByDrag(items, "d", "b")).toEqual([
      { documentId: "a", index: 0 },
      { documentId: "d", index: 1 },
      { documentId: "b", index: 2 },
      { documentId: "c", index: 3 },
      { documentId: "e", index: 4 },
    ]);
  });

  it("produces backend updates matching new order", () => {
    const reordered = reorderSubTasksByDrag(items, "b", "d");
    expect(reordered).not.toBeNull();
    const updates = buildSubTaskIndexUpdates(
      reordered!.map((item) => item.documentId),
    );
    expect(updates).toEqual([
      { documentId: "a", index: 0 },
      { documentId: "c", index: 1 },
      { documentId: "d", index: 2 },
      { documentId: "b", index: 3 },
      { documentId: "e", index: 4 },
    ]);
  });
});
