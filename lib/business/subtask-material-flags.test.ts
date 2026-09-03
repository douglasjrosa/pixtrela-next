import { describe, expect, it } from "vitest";

import {
  assertFinishFlagsAllowed,
  canConfirmFinishWithFlags,
  isSemBandeiraHint,
  mergeFlagIds,
  resolveCategoryIdFromFlagCategories,
} from "./subtask-material-flags";

const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";

describe("assertFinishFlagsAllowed", () => {
  it("allows finish without flags when there are no dependents", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: true,
        hasDependents: false,
        categoryId: null,
        totalFlagCount: 0,
        availableCount: 0,
      }),
    ).not.toThrow();
  });

  it("allows finish with no category (Sem bandeira)", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: true,
        hasDependents: true,
        categoryId: null,
        totalFlagCount: 0,
        availableCount: 0,
      }),
    ).not.toThrow();
  });

  it("allows finish with category when no flags are available (Sem bandeira)", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: true,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        totalFlagCount: 0,
        availableCount: 0,
      }),
    ).not.toThrow();
  });

  it("requires at least one flag when finishing with dependents and available flags", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: true,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        totalFlagCount: 0,
        availableCount: 2,
      }),
    ).toThrow("flagsRequired");
  });

  it("allows finish when at least one flag is selected", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: true,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        totalFlagCount: 1,
        availableCount: 2,
      }),
    ).not.toThrow();
  });

  it("allows partial stop without flags even with dependents", () => {
    expect(() =>
      assertFinishFlagsAllowed({
        willFinish: false,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        totalFlagCount: 0,
        availableCount: 3,
      }),
    ).not.toThrow();
  });
});

describe("canConfirmFinishWithFlags", () => {
  it("allows confirm when not finishing or without dependents", () => {
    expect(
      canConfirmFinishWithFlags({
        willFinish: false,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        selectedFlagCount: 0,
        availableFlagCount: 2,
        semBandeiraSelected: false,
      }),
    ).toBe(true);
    expect(
      canConfirmFinishWithFlags({
        willFinish: true,
        hasDependents: false,
        categoryId: CATEGORY_ID,
        selectedFlagCount: 0,
        availableFlagCount: 2,
        semBandeiraSelected: false,
      }),
    ).toBe(true);
  });

  it("allows confirm when Sem categoria (locked Sem bandeira)", () => {
    expect(
      canConfirmFinishWithFlags({
        willFinish: true,
        hasDependents: true,
        categoryId: null,
        selectedFlagCount: 0,
        availableFlagCount: 0,
        semBandeiraSelected: false,
      }),
    ).toBe(true);
  });

  it("requires a selected flag when flags are available", () => {
    expect(
      canConfirmFinishWithFlags({
        willFinish: true,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        selectedFlagCount: 0,
        availableFlagCount: 1,
        semBandeiraSelected: false,
      }),
    ).toBe(false);
    expect(
      canConfirmFinishWithFlags({
        willFinish: true,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        selectedFlagCount: 1,
        availableFlagCount: 1,
        semBandeiraSelected: false,
      }),
    ).toBe(true);
  });

  it("requires explicit Sem bandeira when none available", () => {
    expect(
      canConfirmFinishWithFlags({
        willFinish: true,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        selectedFlagCount: 0,
        availableFlagCount: 0,
        semBandeiraSelected: false,
      }),
    ).toBe(false);
    expect(
      canConfirmFinishWithFlags({
        willFinish: true,
        hasDependents: true,
        categoryId: CATEGORY_ID,
        selectedFlagCount: 0,
        availableFlagCount: 0,
        semBandeiraSelected: true,
      }),
    ).toBe(true);
  });
});

describe("isSemBandeiraHint", () => {
  it("is true when predecessor has no category", () => {
    expect(isSemBandeiraHint({ categoryId: null, status: "producing" })).toBe(
      true,
    );
  });

  it("is true when predecessor finished without assigned flags", () => {
    expect(
      isSemBandeiraHint({
        categoryId: CATEGORY_ID,
        status: "finished",
        assignedFlagCodes: [],
      }),
    ).toBe(true);
  });

  it("is false when predecessor has assigned flags", () => {
    expect(
      isSemBandeiraHint({
        categoryId: CATEGORY_ID,
        status: "finished",
        assignedFlagCodes: ["ALM-1"],
      }),
    ).toBe(false);
  });

  it("is false when predecessor has category but is not finished and has no flags", () => {
    expect(
      isSemBandeiraHint({
        categoryId: CATEGORY_ID,
        status: "producing",
        assignedFlagCodes: [],
      }),
    ).toBe(false);
  });
});

describe("mergeFlagIds", () => {
  it("uniques existing and next ids", () => {
    expect(mergeFlagIds(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
});

describe("resolveCategoryIdFromFlagCategories", () => {
  it("keeps stored category when present", () => {
    expect(resolveCategoryIdFromFlagCategories("cat-a", ["cat-b"])).toBe(
      "cat-a",
    );
  });

  it("uses first flag category when stored is empty", () => {
    expect(
      resolveCategoryIdFromFlagCategories(null, ["cat-b", "cat-b"]),
    ).toBe("cat-b");
  });
});
