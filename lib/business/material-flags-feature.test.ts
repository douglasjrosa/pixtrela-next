import { describe, expect, it } from "vitest";

import {
  MATERIAL_FLAGS_DISABLED_ERROR,
  areMaterialFlagsEnabled,
  assertMaterialFlagsEnabled,
  isMaterialFlagsDisabledError,
} from "./material-flags-feature";

describe("areMaterialFlagsEnabled", () => {
  it("is true only for the explicit enabled flag", () => {
    expect(areMaterialFlagsEnabled(true)).toBe(true);
    expect(areMaterialFlagsEnabled(false)).toBe(false);
  });
});

describe("assertMaterialFlagsEnabled", () => {
  it("allows mutations when the feature is on", () => {
    expect(() => assertMaterialFlagsEnabled(true)).not.toThrow();
  });

  it("blocks mutations with a reportable code when the feature is off", () => {
    expect(() => assertMaterialFlagsEnabled(false)).toThrow(
      MATERIAL_FLAGS_DISABLED_ERROR,
    );
  });
});

describe("isMaterialFlagsDisabledError", () => {
  it("detects the stable domain code", () => {
    expect(
      isMaterialFlagsDisabledError(new Error(MATERIAL_FLAGS_DISABLED_ERROR)),
    ).toBe(true);
    expect(isMaterialFlagsDisabledError(new Error("flagsRequired"))).toBe(
      false,
    );
  });
});
