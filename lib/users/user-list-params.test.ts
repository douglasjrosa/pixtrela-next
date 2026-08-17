import { describe, expect, it } from "vitest";

import {
  defaultUserListFilters,
  parseUserListSearchParams,
  serializeUserListSearchParams,
  userListFilterKey,
} from "./user-list-params";

describe("parseUserListSearchParams", () => {
  it("applies empty defaults when params are empty", () => {
    const filters = parseUserListSearchParams({});
    expect(filters.q).toBeUndefined();
    expect(filters.column).toBe("name");
    expect(filters.direction).toBe("asc");
  });

  it("parses q from a single character", () => {
    const filters = parseUserListSearchParams({ q: "M" });
    expect(filters.q).toBe("M");
  });

  it("parses sort and direction", () => {
    const filters = parseUserListSearchParams({
      sort: "code",
      dir: "desc",
    });
    expect(filters.column).toBe("code");
    expect(filters.direction).toBe("desc");
  });
});

describe("serializeUserListSearchParams", () => {
  it("omits empty defaults", () => {
    const params = serializeUserListSearchParams(defaultUserListFilters());
    expect(params.toString()).toBe("");
  });

  it("includes q when set", () => {
    const params = serializeUserListSearchParams({
      ...defaultUserListFilters(),
      q: "Maria",
    });
    expect(params.get("q")).toBe("Maria");
  });

  it("includes sort params when not default", () => {
    const params = serializeUserListSearchParams({
      ...defaultUserListFilters(),
      column: "role",
      direction: "asc",
    });
    expect(params.get("sort")).toBe("role");
    expect(params.get("dir")).toBe("asc");
  });
});

describe("userListFilterKey", () => {
  it("changes when q or sort changes", () => {
    const base = defaultUserListFilters();
    expect(userListFilterKey({ ...base, q: "a" })).not.toBe(
      userListFilterKey(base),
    );
    expect(
      userListFilterKey({ ...base, column: "code", direction: "asc" }),
    ).not.toBe(userListFilterKey(base));
  });
});
