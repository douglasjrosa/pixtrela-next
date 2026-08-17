import { describe, expect, it } from "vitest";

import {
  defaultTemplateListFilters,
  parseTemplateListSearchParams,
  serializeTemplateListSearchParams,
  templateListFilterKey,
} from "./template-list-params";

describe("parseTemplateListSearchParams", () => {
  it("applies empty defaults when params are empty", () => {
    const filters = parseTemplateListSearchParams({});
    expect(filters.q).toBeUndefined();
    expect(filters.showArchived).toBe(false);
  });

  it("parses q", () => {
    const filters = parseTemplateListSearchParams({ q: "mont" });
    expect(filters.q).toBe("mont");
  });

  it("ignores q shorter than 3 characters", () => {
    const filters = parseTemplateListSearchParams({ q: "ab" });
    expect(filters.q).toBeUndefined();
  });

  it("parses archived=1", () => {
    const filters = parseTemplateListSearchParams({ archived: "1" });
    expect(filters.showArchived).toBe(true);
  });

  it("ignores legacy code query param", () => {
    const filters = parseTemplateListSearchParams({ code: "100" });
    expect(filters.q).toBeUndefined();
  });

  it("applies default sort when params are empty", () => {
    const filters = parseTemplateListSearchParams({});
    expect(filters.column).toBe("name");
    expect(filters.direction).toBe("asc");
  });

  it("parses sort and direction", () => {
    const filters = parseTemplateListSearchParams({
      sort: "code",
      dir: "desc",
    });
    expect(filters.column).toBe("code");
    expect(filters.direction).toBe("desc");
  });
});

describe("serializeTemplateListSearchParams", () => {
  it("omits empty defaults", () => {
    const params = serializeTemplateListSearchParams(
      defaultTemplateListFilters(),
    );
    expect(params.toString()).toBe("");
  });

  it("includes q when set", () => {
    const params = serializeTemplateListSearchParams({
      ...defaultTemplateListFilters(),
      q: "mont",
    });
    expect(params.get("q")).toBe("mont");
    expect(params.has("code")).toBe(false);
  });

  it("includes archived when true", () => {
    const params = serializeTemplateListSearchParams({
      ...defaultTemplateListFilters(),
      showArchived: true,
    });
    expect(params.get("archived")).toBe("1");
  });

  it("includes sort params when not default", () => {
    const params = serializeTemplateListSearchParams({
      ...defaultTemplateListFilters(),
      column: "subTaskCount",
      direction: "desc",
    });
    expect(params.get("sort")).toBe("subTaskCount");
    expect(params.get("dir")).toBe("desc");
  });
});

describe("templateListFilterKey", () => {
  it("changes when q or sort changes", () => {
    const base = defaultTemplateListFilters();
    expect(templateListFilterKey({ ...base, q: "a" })).not.toBe(
      templateListFilterKey(base),
    );
    expect(
      templateListFilterKey({ ...base, showArchived: true }),
    ).not.toBe(templateListFilterKey(base));
  });
});
