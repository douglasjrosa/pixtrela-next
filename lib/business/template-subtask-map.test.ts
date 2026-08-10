import { describe, expect, it } from "vitest";

import {
  mergeServerTemplateSubTasksWithDrafts,
  type TemplateSubTaskRow,
} from "./template-subtask-map";

function row(
  rowKey: string,
  index: number,
  overrides: Partial<TemplateSubTaskRow> = {},
): TemplateSubTaskRow {
  return {
    rowKey,
    name: rowKey,
    qty: 1,
    index,
    expectedTime: 0,
    sharingType: "duration",
    maxSameTimeWorkers: 1,
    dependencyIndexes: [],
    ...overrides,
  };
}

describe("mergeServerTemplateSubTasksWithDrafts", () => {
  it("does not duplicate a draft already present in the server rows", () => {
    const draft = row("draft:abc", 1, { isDraft: true });
    const server = [row("row-0", 0), draft];

    const merged = mergeServerTemplateSubTasksWithDrafts(server, [draft]);

    const keys = merged.map((item) => item.rowKey);
    expect(keys).toEqual(["row-0", "draft:abc"]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("merges drafts missing from the server rows", () => {
    const server = [row("row-0", 0)];
    const draft = row("draft:xyz", 1, { isDraft: true });

    const merged = mergeServerTemplateSubTasksWithDrafts(server, [draft]);

    expect(merged.map((item) => item.rowKey)).toEqual(["row-0", "draft:xyz"]);
    expect(merged.map((item) => item.index)).toEqual([0, 1]);
  });

  it("returns the server rows unchanged when there are no drafts", () => {
    const server = [row("row-0", 0), row("row-1", 1)];
    expect(mergeServerTemplateSubTasksWithDrafts(server, [])).toBe(server);
  });
});
