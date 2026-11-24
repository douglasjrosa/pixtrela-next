import { describe, expect, it } from "vitest";

import { defaultWorkdayListFilters } from "./workday-list-params";
import { buildWorkdayListSortHref } from "./workday-list-sort-url";

describe("buildWorkdayListSortHref", () => {
  it("toggles direction when clicking the default createdAt sort", () => {
    const href = buildWorkdayListSortHref(
      defaultWorkdayListFilters(),
      "createdAt",
    );
    expect(href).toBe("/workdays?sort=createdAt&dir=asc");
  });

  it("preserves filters when switching sort column", () => {
    const href = buildWorkdayListSortHref(
      {
        ...defaultWorkdayListFilters(),
        action: "off",
        scope: "global",
      },
      "action",
    );
    expect(href).toBe("/workdays?action=off&scope=global&sort=action&dir=asc");
  });
});
