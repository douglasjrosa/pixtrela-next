import { describe, expect, it } from "vitest";

import { isInconsistentMaterialFlagAssignment } from "./material-flag-assignment-consistency";

const CATEGORY_ID = "cat-wood";

describe("isInconsistentMaterialFlagAssignment", () => {
  it("releases flags on finished sub-tasks", () => {
    expect(
      isInconsistentMaterialFlagAssignment({
        subTaskStatus: "finished",
        subTaskCategoryId: CATEGORY_ID,
        flagCategoryId: CATEGORY_ID,
      }),
    ).toBe(true);
  });

  it("releases flags whose catalog row is missing", () => {
    expect(
      isInconsistentMaterialFlagAssignment({
        subTaskStatus: "producing",
        subTaskCategoryId: CATEGORY_ID,
        flagCategoryId: null,
      }),
    ).toBe(true);
  });

  it("releases flags when the sub-task has no category", () => {
    expect(
      isInconsistentMaterialFlagAssignment({
        subTaskStatus: "producing",
        subTaskCategoryId: null,
        flagCategoryId: CATEGORY_ID,
      }),
    ).toBe(true);
  });

  it("releases flags whose category no longer matches the sub-task", () => {
    expect(
      isInconsistentMaterialFlagAssignment({
        subTaskStatus: "producing",
        subTaskCategoryId: CATEGORY_ID,
        flagCategoryId: "cat-other",
      }),
    ).toBe(true);
  });

  it("keeps a matching assignment on an active sub-task", () => {
    expect(
      isInconsistentMaterialFlagAssignment({
        subTaskStatus: "producing",
        subTaskCategoryId: CATEGORY_ID,
        flagCategoryId: CATEGORY_ID,
      }),
    ).toBe(false);
  });
});
