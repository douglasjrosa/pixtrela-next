import { describe, expect, it } from "vitest";

import {
  defaultTeamListFilters,
  parseTeamListSearchParams,
  serializeTeamListSearchParams,
  teamListFilterKey,
} from "./team-list-params";

describe("parseTeamListSearchParams", () => {
  it("applies empty defaults when params are empty", () => {
    const filters = parseTeamListSearchParams({});
    expect(filters.q).toBeUndefined();
    expect(filters.column).toBe("name");
    expect(filters.direction).toBe("asc");
  });

  it("parses q from a single character", () => {
    const filters = parseTeamListSearchParams({ q: "L" });
    expect(filters.q).toBe("L");
  });

  it("parses sort and direction", () => {
    const filters = parseTeamListSearchParams({
      sort: "leader",
      dir: "desc",
    });
    expect(filters.column).toBe("leader");
    expect(filters.direction).toBe("desc");
  });
});

describe("serializeTeamListSearchParams", () => {
  it("omits empty defaults", () => {
    const params = serializeTeamListSearchParams(defaultTeamListFilters());
    expect(params.toString()).toBe("");
  });

  it("includes q when set", () => {
    const params = serializeTeamListSearchParams({
      ...defaultTeamListFilters(),
      q: "Linha",
    });
    expect(params.get("q")).toBe("Linha");
  });

  it("includes sort params when not default", () => {
    const params = serializeTeamListSearchParams({
      ...defaultTeamListFilters(),
      column: "status",
      direction: "desc",
    });
    expect(params.get("sort")).toBe("status");
    expect(params.get("dir")).toBe("desc");
  });
});

describe("teamListFilterKey", () => {
  it("changes when q or sort changes", () => {
    const base = defaultTeamListFilters();
    expect(teamListFilterKey({ ...base, q: "a" })).not.toBe(
      teamListFilterKey(base),
    );
    expect(
      teamListFilterKey({ ...base, column: "leader", direction: "asc" }),
    ).not.toBe(teamListFilterKey(base));
  });
});
