import { describe, expect, it } from "vitest";

import {
  defaultAwardListFilters,
  parseAwardListSearchParams,
  serializeAwardListSearchParams,
  awardListFilterKey,
} from "./award-list-params";

describe("parseAwardListSearchParams", () => {
  it("applies empty defaults when params are empty", () => {
    const filters = parseAwardListSearchParams({});
    expect(filters.q).toBeUndefined();
    expect(filters.column).toBe("title");
    expect(filters.direction).toBe("asc");
    expect(filters.showArchived).toBe(false);
  });

  it("parses q from a single character", () => {
    const filters = parseAwardListSearchParams({ q: "A" });
    expect(filters.q).toBe("A");
  });

  it("parses sort and direction", () => {
    const filters = parseAwardListSearchParams({
      sort: "starCost",
      dir: "desc",
    });
    expect(filters.column).toBe("starCost");
    expect(filters.direction).toBe("desc");
  });

  it("parses showArchived from archived=1", () => {
    const filters = parseAwardListSearchParams({ archived: "1" });
    expect(filters.showArchived).toBe(true);
  });
});

describe("serializeAwardListSearchParams", () => {
  it("omits empty defaults", () => {
    const params = serializeAwardListSearchParams(defaultAwardListFilters());
    expect(params.toString()).toBe("");
  });

  it("includes q when set", () => {
    const params = serializeAwardListSearchParams({
      ...defaultAwardListFilters(),
      q: "Arroz",
    });
    expect(params.get("q")).toBe("Arroz");
  });

  it("includes sort params when not default", () => {
    const params = serializeAwardListSearchParams({
      ...defaultAwardListFilters(),
      column: "starCost",
      direction: "asc",
    });
    expect(params.get("sort")).toBe("starCost");
    expect(params.get("dir")).toBe("asc");
  });

  it("includes archived when showArchived is true", () => {
    const params = serializeAwardListSearchParams({
      ...defaultAwardListFilters(),
      showArchived: true,
    });
    expect(params.get("archived")).toBe("1");
  });
});

describe("awardListFilterKey", () => {
  it("changes when q or sort changes", () => {
    const base = defaultAwardListFilters();
    expect(awardListFilterKey({ ...base, q: "a" })).not.toBe(
      awardListFilterKey(base),
    );
    expect(
      awardListFilterKey({ ...base, column: "starCost", direction: "asc" }),
    ).not.toBe(awardListFilterKey(base));
    expect(
      awardListFilterKey({ ...base, showArchived: true }),
    ).not.toBe(awardListFilterKey(base));
  });
});
