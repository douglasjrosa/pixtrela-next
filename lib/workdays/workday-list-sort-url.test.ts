import { describe, expect, it } from "vitest";

import { defaultWorkdayListFilters } from "./workday-list-params";
import { buildWorkdayListSortHref } from "./workday-list-sort-url";

describe("buildWorkdayListSortHref", () => {
  it("toggles direction when clicking active sort column", () => {
    const href = buildWorkdayListSortHref(defaultWorkdayListFilters(), "name");
    expect(href).toBe("/workdays?sort=name&dir=desc");
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
