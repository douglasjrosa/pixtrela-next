import { describe, expect, it } from "vitest";

import {
  defaultTaskListFilters,
  defaultTaskListFrom,
  parseTaskListSearchParams,
  parseTaskListSelectMode,
  serializeTaskListSearchParams,
  taskListFilterKey,
} from "./task-list-params";

const FIXED_NOW = new Date(2026, 6, 15); // 15 Jul 2026 local

describe("defaultTaskListFrom", () => {
  it("returns today minus 30 days", () => {
    expect(defaultTaskListFrom(FIXED_NOW)).toBe("2026-06-15");
  });
});

describe("parseTaskListSearchParams", () => {
  it("applies defaults when params are empty", () => {
    const filters = parseTaskListSearchParams({}, FIXED_NOW);
    expect(filters.statuses).toEqual(["paused", "producing", "waiting"]);
    expect(filters.from).toBe("2026-06-15");
    expect(filters.to).toBe("2026-07-15");
    expect(filters.showArchived).toBe(false);
    expect(filters.q).toBeUndefined();
  });

  it("excludes finished by default", () => {
    const filters = parseTaskListSearchParams({}, FIXED_NOW);
    expect(filters.statuses).not.toContain("finished");
  });

  it("parses status CSV and from/to/q", () => {
    const filters = parseTaskListSearchParams(
      {
        status: "waiting,finished",
        from: "2026-01-01",
        to: "2026-12-31",
        q: "mont",
      },
      FIXED_NOW,
    );
    expect(filters.statuses).toEqual(["finished", "waiting"]);
    expect(filters.from).toBe("2026-01-01");
    expect(filters.to).toBe("2026-12-31");
    expect(filters.q).toBe("mont");
    expect(filters.column).toBe("deliveryDate");
    expect(filters.direction).toBe("asc");
  });

  it("parses sort and direction", () => {
    const filters = parseTaskListSearchParams(
      { sort: "name", dir: "desc" },
      FIXED_NOW,
    );
    expect(filters.column).toBe("name");
    expect(filters.direction).toBe("desc");
  });

  it("parses archived flag", () => {
    const filters = parseTaskListSearchParams({ archived: "1" }, FIXED_NOW);
    expect(filters.showArchived).toBe(true);
  });

  it("parses select mode", () => {
    expect(parseTaskListSelectMode({ select: "1" })).toBe(true);
    expect(parseTaskListSelectMode({})).toBe(false);
  });

  it("ignores q shorter than 3 characters", () => {
    const filters = parseTaskListSearchParams({ q: "ab" }, FIXED_NOW);
    expect(filters.q).toBeUndefined();
  });

  it("falls back to defaults when from is after to", () => {
    const filters = parseTaskListSearchParams(
      { from: "2026-08-01", to: "2026-07-01" },
      FIXED_NOW,
    );
    expect(filters).toEqual(defaultTaskListFilters(FIXED_NOW));
  });
});

describe("serializeTaskListSearchParams", () => {
  it("omits params equal to defaults", () => {
    const params = serializeTaskListSearchParams(
      defaultTaskListFilters(FIXED_NOW),
      FIXED_NOW,
    );
    expect(params.toString()).toBe("");
  });

  it("includes select=1 when selectMode option is true", () => {
    const params = serializeTaskListSearchParams(
      defaultTaskListFilters(FIXED_NOW),
      FIXED_NOW,
      { selectMode: true },
    );
    expect(params.get("select")).toBe("1");
  });

  it("includes only changed and optional filters", () => {
    const params = serializeTaskListSearchParams(
      {
        statuses: ["finished", "waiting"],
        from: "2026-01-01",
        to: "2026-12-31",
        q: "mont",
        column: "name",
        direction: "desc",
        showArchived: true,
      },
      FIXED_NOW,
    );
    expect(params.get("status")).toBe("finished,waiting");
    expect(params.get("from")).toBe("2026-01-01");
    expect(params.get("to")).toBe("2026-12-31");
    expect(params.get("q")).toBe("mont");
    expect(params.get("sort")).toBe("name");
    expect(params.get("dir")).toBe("desc");
    expect(params.get("archived")).toBe("1");
  });
});

describe("taskListFilterKey", () => {
  it("changes when any filter changes", () => {
    const base = defaultTaskListFilters(FIXED_NOW);
    expect(taskListFilterKey(base)).not.toBe(
      taskListFilterKey({ ...base, q: "abc" }),
    );
  });
});
