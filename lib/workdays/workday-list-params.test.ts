import { describe, expect, it } from "vitest";

import {
  defaultWorkdayListFilters,
  parseWorkdayListSearchParams,
  serializeWorkdayListSearchParams,
  workdayListFilterKey,
} from "./workday-list-params";

describe("workday-list-params", () => {
  it("parses empty params to defaults", () => {
    expect(parseWorkdayListSearchParams({})).toEqual(
      defaultWorkdayListFilters(),
    );
  });

  it("parses q, action, scope, dates, archived, and sort", () => {
    const parsed = parseWorkdayListSearchParams({
      q: "feriado",
      action: "holiday",
      scope: "team",
      from: "2026-11-01",
      to: "2026-11-30",
      archived: "1",
      sort: "scope",
      dir: "desc",
    });

    expect(parsed).toEqual({
      q: "feriado",
      action: "holiday",
      scope: "team",
      dateFrom: "2026-11-01",
      dateTo: "2026-11-30",
      showArchived: true,
      column: "scope",
      direction: "desc",
    });
  });

  it("omits defaults when serializing", () => {
    const params = serializeWorkdayListSearchParams(
      defaultWorkdayListFilters(),
    );
    expect(params.toString()).toBe("");
  });

  it("serializes active filters and sort", () => {
    const params = serializeWorkdayListSearchParams({
      q: "turno",
      action: "work",
      scope: "user",
      dateFrom: "2026-11-01",
      dateTo: undefined,
      showArchived: true,
      column: "action",
      direction: "desc",
    });
    expect(params.get("q")).toBe("turno");
    expect(params.get("action")).toBe("work");
    expect(params.get("scope")).toBe("user");
    expect(params.get("from")).toBe("2026-11-01");
    expect(params.get("archived")).toBe("1");
    expect(params.get("sort")).toBe("action");
    expect(params.get("dir")).toBe("desc");
  });

  it("produces distinct keys when any filter changes", () => {
    const a = workdayListFilterKey(defaultWorkdayListFilters());
    const b = workdayListFilterKey({
      ...defaultWorkdayListFilters(),
      action: "off",
    });
    expect(a).not.toBe(b);
  });
});
