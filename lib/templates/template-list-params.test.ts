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
    expect(filters.code).toBeUndefined();
  });

  it("parses q and code", () => {
    const filters = parseTemplateListSearchParams({
      q: "mont",
      code: "100",
    });
    expect(filters.q).toBe("mont");
    expect(filters.code).toBe("100");
  });

  it("ignores q shorter than 3 characters", () => {
    const filters = parseTemplateListSearchParams({ q: "ab" });
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

  it("includes set filters", () => {
    const params = serializeTemplateListSearchParams({
      q: "mont",
      code: "100",
    });
    expect(params.get("q")).toBe("mont");
    expect(params.get("code")).toBe("100");
  });
});

describe("templateListFilterKey", () => {
  it("joins q and code", () => {
    expect(templateListFilterKey({ q: "a", code: "b" })).toBe("a|b");
    expect(templateListFilterKey({})).toBe("|");
  });
});
