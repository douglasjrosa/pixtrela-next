import { describe, expect, it } from "vitest";

import { isTaskListDateRangeWithinMaxMonths } from "./task-list-date-range";

describe("isTaskListDateRangeWithinMaxMonths", () => {
  it("accepts ranges up to three months", () => {
    expect(
      isTaskListDateRangeWithinMaxMonths("2026-01-15", "2026-04-15"),
    ).toBe(true);
  });

  it("rejects ranges longer than three months", () => {
    expect(
      isTaskListDateRangeWithinMaxMonths("2026-01-15", "2026-04-16"),
    ).toBe(false);
  });
});
