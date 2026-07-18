import { describe, expect, it } from "vitest";

import { buildTemplateListQuery } from "./build-template-list-query";

describe("buildTemplateListQuery", () => {
  it("paginates and sorts by name without filters", () => {
    const query = buildTemplateListQuery({}, 1);
    expect(query.sort).toBe("name:asc");
    expect(query.pagination).toEqual({ page: 1, pageSize: 10 });
    expect(query.filters).toBeUndefined();
  });

  it("adds name and code containsi filters", () => {
    const query = buildTemplateListQuery({ q: "mont", code: "10" }, 2);
    expect(query.filters).toEqual({
      name: { $containsi: "mont" },
      code: { $containsi: "10" },
    });
    expect(query.pagination).toEqual({ page: 2, pageSize: 10 });
  });
});
