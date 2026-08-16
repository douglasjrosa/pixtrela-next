import { describe, expect, it } from "vitest";

import { defaultTeamListFilters } from "./team-list-params";
import { buildTeamListHref, buildTeamListSortHref } from "./team-list-sort-url";

describe("buildTeamListSortHref", () => {
  it("adds sort params when switching away from default name asc", () => {
    const filters = defaultTeamListFilters();
    expect(buildTeamListSortHref(filters, "status")).toBe(
      "/teams?sort=status&dir=asc",
    );
  });

  it("toggles direction on the active column", () => {
    const filters = {
      ...defaultTeamListFilters(),
      column: "status" as const,
      direction: "asc" as const,
    };
    expect(buildTeamListSortHref(filters, "status")).toBe(
      "/teams?sort=status&dir=desc",
    );
  });

  it("returns /teams when toggling name desc back to default", () => {
    const filters = {
      ...defaultTeamListFilters(),
      column: "name" as const,
      direction: "desc" as const,
    };
    expect(buildTeamListSortHref(filters, "name")).toBe("/teams");
  });
});

describe("buildTeamListHref", () => {
  it("preserves q when present", () => {
    const filters = { ...defaultTeamListFilters(), q: "Linha" };
    expect(buildTeamListHref(filters)).toBe("/teams?q=Linha");
  });
});
