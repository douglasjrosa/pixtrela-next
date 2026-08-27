import { describe, expect, it } from "vitest";

import {
  defaultFactoryActionListFilters,
  parseFactoryActionListSearchParams,
} from "./factory-action-list-params";

describe("parseFactoryActionListSearchParams", () => {
  it("applies default sort when params are empty", () => {
    const filters = parseFactoryActionListSearchParams({});
    expect(filters).toEqual(defaultFactoryActionListFilters());
  });

  it("parses unitTime sort", () => {
    const filters = parseFactoryActionListSearchParams({
      sort: "unitTime",
      dir: "desc",
    });
    expect(filters.column).toBe("unitTime");
    expect(filters.direction).toBe("desc");
  });
});
