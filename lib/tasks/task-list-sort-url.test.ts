import { describe, expect, it } from "vitest";

import { defaultTaskListFilters } from "./task-list-params";
import { buildTaskListHref, buildTaskListSortHref } from "./task-list-sort-url";

const FIXED_NOW = new Date(2026, 6, 15);

describe("buildTaskListSortHref", () => {
  it("returns /tasks when toggling default sort column from defaults", () => {
    const filters = defaultTaskListFilters(FIXED_NOW);
    expect(buildTaskListSortHref(filters, "name", { now: FIXED_NOW })).toBe(
      "/tasks?sort=name&dir=asc",
    );
  });

  it("toggles direction on the active column", () => {
    const filters = {
      ...defaultTaskListFilters(FIXED_NOW),
      column: "name" as const,
      direction: "asc" as const,
    };
    expect(buildTaskListSortHref(filters, "name", { now: FIXED_NOW })).toBe(
      "/tasks?sort=name&dir=desc",
    );
  });

  it("preserves select mode when requested", () => {
    const filters = defaultTaskListFilters(FIXED_NOW);
    expect(
      buildTaskListSortHref(filters, "qty", { now: FIXED_NOW, selectMode: true }),
    ).toBe("/tasks?sort=qty&dir=asc&select=1");
  });
});

describe("buildTaskListHref", () => {
  it("adds select=1 when selectMode is true", () => {
    const filters = defaultTaskListFilters(FIXED_NOW);
    expect(buildTaskListHref(filters, { now: FIXED_NOW, selectMode: true })).toBe(
      "/tasks?select=1",
    );
  });
});
