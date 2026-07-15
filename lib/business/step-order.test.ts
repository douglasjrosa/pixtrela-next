import { describe, expect, it } from "vitest";

import {
  applySequentialStepIndices,
  buildStepIndexUpdates,
  getNextStepIndex,
  moveStepInOrder,
  reorderStepsByDrag,
} from "./step-order";

describe("getNextStepIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(getNextStepIndex([])).toBe(0);
  });

  it("returns max index plus one", () => {
    expect(getNextStepIndex([{ index: 0 }, { index: 2 }])).toBe(3);
  });
});

describe("buildStepIndexUpdates", () => {
  it("assigns sequential 0-based indexes", () => {
    expect(buildStepIndexUpdates(["c", "a", "b"])).toEqual([
      { documentId: "c", index: 0 },
      { documentId: "a", index: 1 },
      { documentId: "b", index: 2 },
    ]);
  });
});

describe("moveStepInOrder", () => {
  const items = [
    { documentId: "a", name: "A" },
    { documentId: "b", name: "B" },
    { documentId: "c", name: "C" },
  ];

  it("moves an item to a new position", () => {
    expect(moveStepInOrder(items, "a", "c")?.map((item) => item.documentId)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("returns null when ids are equal or unknown", () => {
    expect(moveStepInOrder(items, "a", "a")).toBeNull();
    expect(moveStepInOrder(items, "a", "missing")).toBeNull();
  });
});

describe("applySequentialStepIndices", () => {
  it("assigns 0-based indexes in list order", () => {
    expect(
      applySequentialStepIndices([
        { documentId: "c", index: 5 },
        { documentId: "a", index: 0 },
      ]),
    ).toEqual([
      { documentId: "c", index: 0 },
      { documentId: "a", index: 1 },
    ]);
  });
});

describe("reorderStepsByDrag", () => {
  const items = [
    { documentId: "a", index: 0 },
    { documentId: "b", index: 1 },
    { documentId: "c", index: 2 },
    { documentId: "d", index: 3 },
  ];

  it("moves a step and reassigns sequential indexes", () => {
    expect(reorderStepsByDrag(items, "b", "d")).toEqual([
      { documentId: "a", index: 0 },
      { documentId: "c", index: 1 },
      { documentId: "d", index: 2 },
      { documentId: "b", index: 3 },
    ]);
  });

  it("produces backend updates matching new order", () => {
    const reordered = reorderStepsByDrag(items, "b", "d");
    expect(reordered).not.toBeNull();
    expect(
      buildStepIndexUpdates(reordered!.map((item) => item.documentId)),
    ).toEqual([
      { documentId: "a", index: 0 },
      { documentId: "c", index: 1 },
      { documentId: "d", index: 2 },
      { documentId: "b", index: 3 },
    ]);
  });
});
