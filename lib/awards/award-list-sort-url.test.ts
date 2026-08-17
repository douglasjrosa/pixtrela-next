import { describe, expect, it } from "vitest";

import { defaultAwardListFilters } from "./award-list-params";
import {
  buildAwardListHref,
  buildAwardListSortHref,
} from "./award-list-sort-url";

describe("buildAwardListSortHref", () => {
  it("adds sort params when switching away from default title asc", () => {
    const filters = defaultAwardListFilters();
    expect(buildAwardListSortHref(filters, "starCost")).toBe(
      "/awards?sort=starCost&dir=asc",
    );
  });

  it("toggles direction on the active column", () => {
    const filters = {
      ...defaultAwardListFilters(),
      column: "starCost" as const,
      direction: "asc" as const,
    };
    expect(buildAwardListSortHref(filters, "starCost")).toBe(
      "/awards?sort=starCost&dir=desc",
    );
  });

  it("returns /awards when toggling title desc back to default", () => {
    const filters = {
      ...defaultAwardListFilters(),
      column: "title" as const,
      direction: "desc" as const,
    };
    expect(buildAwardListSortHref(filters, "title")).toBe("/awards");
  });
});

describe("buildAwardListHref", () => {
  it("preserves q when present", () => {
    const filters = { ...defaultAwardListFilters(), q: "Arroz" };
    expect(buildAwardListHref(filters)).toBe("/awards?q=Arroz");
  });
});
