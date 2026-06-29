import { describe, expect, it } from "vitest";

import {
  buildClonedSubTaskName,
  insertSubTaskCloneAt,
} from "./subtask-clone";

describe("buildClonedSubTaskName", () => {
  it("appends the copy suffix to the subtask name", () => {
    expect(buildClonedSubTaskName("Soldar")).toBe("Soldar - CÓPIA");
  });
});

describe("insertSubTaskCloneAt", () => {
  const items = [
    { documentId: "a", name: "A", index: 0 },
    { documentId: "b", name: "B", index: 1 },
    { documentId: "c", name: "C", index: 2 },
  ];

  it("inserts the clone after the source row and reindexes", () => {
    const next = insertSubTaskCloneAt(items, 1);
    expect(next.map((item) => item.name)).toEqual([
      "A",
      "B",
      "B - CÓPIA",
      "C",
    ]);
    expect(next.map((item) => item.index)).toEqual([0, 1, 2, 3]);
  });

  it("returns the original list when the source index is invalid", () => {
    expect(insertSubTaskCloneAt(items, 9)).toEqual(items);
  });
});
