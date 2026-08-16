import { describe, expect, it } from "vitest";

import { defaultTemplateListFilters } from "./template-list-params";
import {
  buildTemplateListHref,
  buildTemplateListSortHref,
} from "./template-list-sort-url";

describe("buildTemplateListSortHref", () => {
  it("adds sort params when switching away from default name asc", () => {
    const filters = defaultTemplateListFilters();
    expect(buildTemplateListSortHref(filters, "code")).toBe(
      "/templates/tasks?sort=code&dir=asc",
    );
  });

  it("toggles direction on the active column", () => {
    const filters = {
      ...defaultTemplateListFilters(),
      column: "code" as const,
      direction: "asc" as const,
    };
    expect(buildTemplateListSortHref(filters, "code")).toBe(
      "/templates/tasks?sort=code&dir=desc",
    );
  });

  it("returns /templates/tasks when toggling name desc back to default", () => {
    const filters = {
      ...defaultTemplateListFilters(),
      column: "name" as const,
      direction: "desc" as const,
    };
    expect(buildTemplateListSortHref(filters, "name")).toBe("/templates/tasks");
  });
});

describe("buildTemplateListHref", () => {
  it("preserves q when present", () => {
    const filters = { ...defaultTemplateListFilters(), q: "mont" };
    expect(buildTemplateListHref(filters)).toBe("/templates/tasks?q=mont");
  });
});
