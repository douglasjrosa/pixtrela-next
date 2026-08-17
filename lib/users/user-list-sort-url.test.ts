import { describe, expect, it } from "vitest";

import { defaultUserListFilters } from "./user-list-params";
import { buildUserListHref, buildUserListSortHref } from "./user-list-sort-url";

describe("buildUserListSortHref", () => {
  it("adds sort params when switching away from default name asc", () => {
    const filters = defaultUserListFilters();
    expect(buildUserListSortHref(filters, "code")).toBe(
      "/users?sort=code&dir=asc",
    );
  });

  it("toggles direction on the active column", () => {
    const filters = {
      ...defaultUserListFilters(),
      column: "code" as const,
      direction: "asc" as const,
    };
    expect(buildUserListSortHref(filters, "code")).toBe(
      "/users?sort=code&dir=desc",
    );
  });

  it("returns /users when toggling name desc back to default", () => {
    const filters = {
      ...defaultUserListFilters(),
      column: "name" as const,
      direction: "desc" as const,
    };
    expect(buildUserListSortHref(filters, "name")).toBe("/users");
  });
});

describe("buildUserListHref", () => {
  it("preserves q when present", () => {
    const filters = { ...defaultUserListFilters(), q: "Maria" };
    expect(buildUserListHref(filters)).toBe("/users?q=Maria");
  });
});
