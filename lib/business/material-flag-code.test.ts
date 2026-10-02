import { describe, expect, it } from "vitest";

import {
  formatMaterialFlagCode,
  isValidMaterialFlagRef,
  normalizeMaterialFlagRef,
  sortMaterialFlagOptionsByCode,
} from "./material-flag-code";

describe("formatMaterialFlagCode", () => {
  it("formats ref and index as CODE-index", () => {
    expect(formatMaterialFlagCode("ALM", 37)).toBe("ALM-37");
    expect(formatMaterialFlagCode("C", 3)).toBe("C-3");
  });
});

describe("material flag ref", () => {
  it("accepts letters only", () => {
    expect(isValidMaterialFlagRef("ALM")).toBe(true);
    expect(isValidMaterialFlagRef("c")).toBe(true);
    expect(isValidMaterialFlagRef("C3")).toBe(false);
    expect(isValidMaterialFlagRef("")).toBe(false);
  });

  it("normalizes to uppercase", () => {
    expect(normalizeMaterialFlagRef(" alm ")).toBe("ALM");
  });
});

describe("sortMaterialFlagOptionsByCode", () => {
  it("sorts flag badges by code ascending without mutating the input", () => {
    const flags = [
      { id: "c", code: "MAD-2" },
      { id: "a", code: "ALM-10" },
      { id: "b", code: "ALM-2" },
    ];

    expect(sortMaterialFlagOptionsByCode(flags).map((flag) => flag.code)).toEqual(
      ["ALM-10", "ALM-2", "MAD-2"],
    );
    expect(flags.map((flag) => flag.code)).toEqual(["MAD-2", "ALM-10", "ALM-2"]);
  });
});
