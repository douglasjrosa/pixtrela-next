import { describe, expect, it } from "vitest";

import { removeTemplateSubTaskAt } from "./template-subtask-remove";

describe("removeTemplateSubTaskAt", () => {
  it("removes the row and shifts dependency indexes", () => {
    const rows = [
      {
        rowKey: "a",
        index: 0,
        dependencyIndexes: [] as number[],
      },
      {
        rowKey: "b",
        index: 1,
        dependencyIndexes: [0],
      },
      {
        rowKey: "c",
        index: 2,
        dependencyIndexes: [1],
      },
    ];

    const next = removeTemplateSubTaskAt(rows, "b");

    expect(next.map((row) => row.rowKey)).toEqual(["a", "c"]);
    expect(next[1]?.dependencyIndexes).toEqual([]);
  });
});
