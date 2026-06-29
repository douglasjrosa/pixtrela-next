import { describe, expect, it } from "vitest";

import {
  insertDraftSubTaskCloneAt,
  isDraftSubTaskId,
  mergeServerSubtasksWithDrafts,
} from "./subtask-draft";

describe("isDraftSubTaskId", () => {
  it("detects draft document ids", () => {
    expect(isDraftSubTaskId("draft:abc")).toBe(true);
    expect(isDraftSubTaskId("st1")).toBe(false);
  });
});

describe("insertDraftSubTaskCloneAt", () => {
  const items = [
    { documentId: "a", name: "A", index: 0, timeSpent: 10 },
    { documentId: "b", name: "B", index: 1, timeSpent: 20 },
  ];

  it("inserts an unsaved draft after the source row", () => {
    const next = insertDraftSubTaskCloneAt(items, 1);
    expect(next.map((item) => item.name)).toEqual([
      "A",
      "B",
      "B - CÓPIA",
    ]);
    expect(next[2]?.isDraft).toBe(true);
    expect(next[2]?.timeSpent).toBe(0);
    expect(isDraftSubTaskId(next[2]?.documentId ?? "")).toBe(true);
  });

  it("allows cloning an existing draft copy", () => {
    const withDraft = insertDraftSubTaskCloneAt(items, 1);
    const next = insertDraftSubTaskCloneAt(withDraft, 2);
    expect(next.map((item) => item.name)).toEqual([
      "A",
      "B",
      "B - CÓPIA",
      "B - CÓPIA - CÓPIA",
    ]);
  });
});

describe("mergeServerSubtasksWithDrafts", () => {
  it("keeps local drafts after server data refreshes", () => {
    const draft = {
      documentId: "draft:1",
      name: "B - CÓPIA",
      index: 2,
      timeSpent: 0,
      isDraft: true,
    };
    const merged = mergeServerSubtasksWithDrafts(
      [
        { documentId: "a", name: "A", index: 0, timeSpent: 10 },
        { documentId: "b", name: "B", index: 1, timeSpent: 20 },
      ],
      [draft],
    );
    expect(merged.map((item) => item.name)).toEqual([
      "A",
      "B",
      "B - CÓPIA",
    ]);
  });
});
