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
  });

  it("parses q", () => {
    const filters = parseTemplateListSearchParams({ q: "mont" });
    expect(filters.q).toBe("mont");
  });

  it("ignores q shorter than 3 characters", () => {
    const filters = parseTemplateListSearchParams({ q: "ab" });
    expect(filters.q).toBeUndefined();
  });

  it("ignores legacy code query param", () => {
    const filters = parseTemplateListSearchParams({ code: "100" });
    expect(filters.q).toBeUndefined();
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
    const params = serializeTemplateListSearchParams({ q: "mont" });
    expect(params.get("q")).toBe("mont");
    expect(params.has("code")).toBe(false);
  });
});

describe("templateListFilterKey", () => {
  it("uses q only", () => {
    expect(templateListFilterKey({ q: "a" })).toBe("a");
    expect(templateListFilterKey({})).toBe("");
  });
});
