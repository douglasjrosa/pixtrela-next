import { describe, expect, it } from "vitest";

import {
  formatMaterialFlagCode,
  isValidMaterialFlagRef,
  normalizeMaterialFlagRef,
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
