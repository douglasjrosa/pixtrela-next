import { describe, expect, it } from "vitest";

import {
  hasBoardRevisionChanged,
  type BoardRevision,
} from "./board-revision";

describe("hasBoardRevisionChanged", () => {
  const base: BoardRevision = {
    activeTaskCount: 3,
    tasksMaxUpdatedAt: "2026-01-01T00:00:00.000Z",
    subTasksMaxUpdatedAt: "2026-01-01T00:00:00.000Z",
    activitiesMaxTimestamp: "2026-01-01T00:00:00.000Z",
    assigneeCount: 5,
    stepsMaxUpdatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("returns false when there is no previous revision", () => {
    expect(hasBoardRevisionChanged(null, base)).toBe(false);
  });

  it("returns false when revision is unchanged", () => {
    expect(hasBoardRevisionChanged(base, base)).toBe(false);
  });

  it("detects active task count changes", () => {
    expect(
      hasBoardRevisionChanged(base, { ...base, activeTaskCount: 4 }),
    ).toBe(true);
  });

  it("detects sub-task updates", () => {
    expect(
      hasBoardRevisionChanged(base, {
        ...base,
        subTasksMaxUpdatedAt: "2026-01-02T00:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("detects kiosk activity changes", () => {
    expect(
      hasBoardRevisionChanged(base, {
        ...base,
        activitiesMaxTimestamp: "2026-01-02T00:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("detects assignee changes", () => {
    expect(
      hasBoardRevisionChanged(base, { ...base, assigneeCount: 6 }),
    ).toBe(true);
  });
});
