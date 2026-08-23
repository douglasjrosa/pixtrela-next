import { describe, expect, it } from "vitest";

import { listPathWithQuery, listSearchParamsRecord } from "./list-url";

describe("list-url", () => {
  it("omits the query string when params are empty", () => {
    expect(listPathWithQuery("/awards", new URLSearchParams())).toBe("/awards");
  });

  it("appends serialized params", () => {
    const params = new URLSearchParams();
    params.set("q", "star");
    params.set("archived", "1");
    expect(listPathWithQuery("/awards", params)).toBe(
      "/awards?q=star&archived=1",
    );
  });

  it("converts URLSearchParams to a record", () => {
    const params = new URLSearchParams("q=gem");
    expect(listSearchParamsRecord(params)).toEqual({ q: "gem" });
  });
});
