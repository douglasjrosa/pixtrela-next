import { describe, expect, it } from "vitest";

import { defaultSubtaskPresetListFilters } from "./subtask-preset-list-params";
import {
  buildSubtaskPresetListHref,
  buildSubtaskPresetListSortHref,
} from "./subtask-preset-list-sort-url";

describe("buildSubtaskPresetListSortHref", () => {
  it("adds sort params when switching away from default name asc", () => {
    const filters = defaultSubtaskPresetListFilters();
    expect(buildSubtaskPresetListSortHref(filters, "sharingType")).toBe(
      "/templates/subtasks?sort=sharingType&dir=asc",
    );
  });

  it("toggles direction on the active column", () => {
    const filters = {
      ...defaultSubtaskPresetListFilters(),
      column: "sharingType" as const,
      direction: "asc" as const,
    };
    expect(buildSubtaskPresetListSortHref(filters, "sharingType")).toBe(
      "/templates/subtasks?sort=sharingType&dir=desc",
    );
  });

  it("returns /templates/subtasks when toggling name desc back to default", () => {
    const filters = {
      ...defaultSubtaskPresetListFilters(),
      column: "name" as const,
      direction: "desc" as const,
    };
    expect(buildSubtaskPresetListSortHref(filters, "name")).toBe(
      "/templates/subtasks",
    );
  });
});

describe("buildSubtaskPresetListHref", () => {
  it("returns the list path for default filters", () => {
    expect(buildSubtaskPresetListHref(defaultSubtaskPresetListFilters())).toBe(
      "/templates/subtasks",
    );
  });
});
