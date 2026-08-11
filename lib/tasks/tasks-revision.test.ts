import { describe, expect, it } from "vitest";

import {
  hasTasksRevisionChanged,
  type TasksRevision,
} from "./tasks-revision";

describe("hasTasksRevisionChanged", () => {
  const base: TasksRevision = { count: 2, maxUpdatedAt: "2026-01-01T00:00:00.000Z" };

  it("returns false when there is no previous revision", () => {
    expect(hasTasksRevisionChanged(null, base)).toBe(false);
  });

  it("returns false when revision is unchanged", () => {
    expect(hasTasksRevisionChanged(base, base)).toBe(false);
  });

  it("returns true when task count changes", () => {
    expect(
      hasTasksRevisionChanged(base, { ...base, count: 3 }),
    ).toBe(true);
  });

  it("returns true when maxUpdatedAt changes", () => {
    expect(
      hasTasksRevisionChanged(base, {
        ...base,
        maxUpdatedAt: "2026-01-02T00:00:00.000Z",
      }),
    ).toBe(true);
  });
});
