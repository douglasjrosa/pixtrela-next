import { describe, expect, it } from "vitest";

import {
  parseTemplateDependencyIndexes,
  parseTemplateDependencyUiIds,
  remapTemplateDependencyIndexes,
} from "./template-subtask-dependency-refs";

describe("parseTemplateDependencyIndexes", () => {
  it("reads numeric dependency indexes from template JSON", () => {
    expect(parseTemplateDependencyIndexes([0, 2, "3"])).toEqual([0, 2]);
  });
});

describe("parseTemplateDependencyUiIds", () => {
  it("converts UI ids back to unique dependency indexes", () => {
    expect(parseTemplateDependencyUiIds(["0", "2", "2", "x"])).toEqual([0, 2]);
  });
});

describe("remapTemplateDependencyIndexes", () => {
  it("updates dependency indexes after reordering rows", () => {
    const row0 = {
      rowKey: "row-0",
      index: 0,
      dependencyIndexes: [] as number[],
    };
    const row1 = { rowKey: "row-1", index: 1, dependencyIndexes: [0] };
    const row2 = { rowKey: "row-2", index: 2, dependencyIndexes: [1] };
    const before = [row0, row1, row2];
    const after = [
      { ...row2, index: 0 },
      { ...row0, index: 1 },
      { ...row1, index: 2 },
    ];

    const remapped = remapTemplateDependencyIndexes(before, after);

    expect(remapped[0]?.dependencyIndexes).toEqual([2]);
    expect(remapped[1]?.dependencyIndexes).toEqual([]);
    expect(remapped[2]?.dependencyIndexes).toEqual([1]);
  });
});
