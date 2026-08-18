import { describe, expect, it } from "vitest";

import {
  assertFinishFlagsAllowed,
  mergeFlagIds,
} from "./subtask-material-flags";

describe("assertFinishFlagsAllowed", () => {
  it("allows finish without flags when there are no dependents", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: true,
        hasDependents: false,
        categoryId: null,
        totalFlagCount: 0,
      }),
    ).not.toThrow();
  });

  it("requires a category and at least one flag when finishing with dependents", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: true,
        hasDependents: true,
        categoryId: null,
        totalFlagCount: 1,
      }),
    ).toThrow("subTaskHasNoCategory");
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: true,
        hasDependents: true,
        categoryId: "11111111-1111-4111-8111-111111111111",
        totalFlagCount: 0,
      }),
    ).toThrow("flagsRequired");
  });

  it("allows partial stop without flags even with dependents", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: false,
        hasDependents: true,
        categoryId: "11111111-1111-4111-8111-111111111111",
        totalFlagCount: 0,
      }),
    ).not.toThrow();
  });
});

describe("mergeFlagIds", () => {
  it("uniques existing and next ids", () => {
    expect(mergeFlagIds(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
});
