import { describe, it, expect } from "vitest";
import { buildStrapiQuery } from "./query";

describe("buildStrapiQuery", () => {
  it("serializes filters and populate for Strapi REST", () => {
    const query = buildStrapiQuery({
      fields: ["name", "status"],
      populate: { step: { fields: ["id"] } },
      filters: { status: { $eq: "waiting" } },
      sort: "index:asc",
    });
    expect(query).toContain("fields");
    expect(query).toContain("populate");
    expect(query).toContain("filters");
    expect(query).toContain("sort");
  });

  it("returns empty string when params are empty", () => {
    expect(buildStrapiQuery({})).toBe("");
  });
});
