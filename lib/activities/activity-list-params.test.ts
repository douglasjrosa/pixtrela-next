import { describe, expect, it } from "vitest";

import {
  defaultActivityListFilters,
  defaultActivityListTo,
  parseActivityListSearchParams,
  serializeActivityListSearchParams,
} from "./activity-list-params";

const FIXED_NOW = new Date(2026, 8, 21, 15, 32, 0);

describe("activity list params", () => {
  it("defaults to today with no future lookahead", () => {
    const filters = defaultActivityListFilters(FIXED_NOW);
    expect(filters.to).toBe("2026-09-21");
    expect(filters.from).toBe("2026-08-22");
    expect(defaultActivityListTo(FIXED_NOW)).toBe("2026-09-21");
    expect(filters.actions).toEqual(["started", "stoped"]);
    expect(filters.column).toBe("timestamp");
    expect(filters.direction).toBe("desc");
  });

  it("omits default params from the URL", () => {
    const filters = parseActivityListSearchParams({}, FIXED_NOW);
    expect(serializeActivityListSearchParams(filters, FIXED_NOW).toString()).toBe(
      "",
    );
  });

  it("keeps a custom end date", () => {
    const filters = parseActivityListSearchParams(
      { to: "2026-09-01" },
      FIXED_NOW,
    );
    expect(filters.to).toBe("2026-09-01");
    expect(serializeActivityListSearchParams(filters, FIXED_NOW).get("to")).toBe(
      "2026-09-01",
    );
  });
});
