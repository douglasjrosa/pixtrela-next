import { describe, expect, it } from "vitest";

import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";
import {
  createSubtaskListCacheEntry,
  SUBTASK_LIST_CACHE_TTL_MS,
  SubtaskListCache,
} from "./subtask-list-cache";

describe("SubtaskListCache", () => {
  it("returns null for missing entries", () => {
    const cache = new SubtaskListCache();
    expect(cache.get("task-1")).toBeNull();
  });

  it("stores and returns entries within TTL", () => {
    const cache = new SubtaskListCache();
    const subtasks = [
      boardSubTaskSummaryStub({ documentId: "st-1", name: "Cut" }),
    ];
    const entry = createSubtaskListCacheEntry(subtasks, 1_000);
    cache.set("task-1", entry);

    expect(cache.get("task-1", 1_000)).toEqual(entry);
    expect(cache.get("task-1", 1_000 + SUBTASK_LIST_CACHE_TTL_MS)).toEqual(
      entry,
    );
  });

  it("expires entries after TTL", () => {
    const cache = new SubtaskListCache();
    const entry = createSubtaskListCacheEntry([], 0);
    cache.set("task-1", entry);

    expect(
      cache.get("task-1", SUBTASK_LIST_CACHE_TTL_MS + 1),
    ).toBeNull();
  });

  it("invalidate removes a single task entry", () => {
    const cache = new SubtaskListCache();
    cache.set("task-1", createSubtaskListCacheEntry([]));
    cache.set("task-2", createSubtaskListCacheEntry([]));

    cache.invalidate("task-1");

    expect(cache.get("task-1")).toBeNull();
    expect(cache.get("task-2")).not.toBeNull();
  });
});
