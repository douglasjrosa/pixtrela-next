import { describe, expect, it } from "vitest";

import {
  defaultSubtaskPresetListFilters,
  parseSubtaskPresetListSearchParams,
  serializeSubtaskPresetListSearchParams,
  subtaskPresetListFilterKey,
} from "./subtask-preset-list-params";

describe("parseSubtaskPresetListSearchParams", () => {
  it("applies default sort when params are empty", () => {
    const filters = parseSubtaskPresetListSearchParams({});
    expect(filters.column).toBe("name");
    expect(filters.direction).toBe("asc");
  });

  it("parses sort and direction", () => {
    const filters = parseSubtaskPresetListSearchParams({
      sort: "actionName",
      dir: "desc",
    });
    expect(filters.column).toBe("actionName");
    expect(filters.direction).toBe("desc");
  });

  it("ignores unknown sort columns", () => {
    const filters = parseSubtaskPresetListSearchParams({ sort: "expectedTime" });
    expect(filters.column).toBe("name");
  });
});

describe("serializeSubtaskPresetListSearchParams", () => {
  it("omits empty defaults", () => {
    const params = serializeSubtaskPresetListSearchParams(
      defaultSubtaskPresetListFilters(),
    );
    expect(params.toString()).toBe("");
  });

  it("includes sort params when not default", () => {
    const params = serializeSubtaskPresetListSearchParams({
      ...defaultSubtaskPresetListFilters(),
      column: "sharingType",
      direction: "desc",
    });
    expect(params.get("sort")).toBe("sharingType");
    expect(params.get("dir")).toBe("desc");
  });
});

describe("subtaskPresetListFilterKey", () => {
  it("changes when sort changes", () => {
    const base = defaultSubtaskPresetListFilters();
    expect(
      subtaskPresetListFilterKey({
        ...base,
        column: "actionName",
        direction: "asc",
      }),
    ).not.toBe(subtaskPresetListFilterKey(base));
  });
});
