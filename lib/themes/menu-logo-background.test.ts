import { describe, expect, it } from "vitest";

import { resolveMenuLogoBackgroundStyle } from "./menu-logo-background";

describe("resolveMenuLogoBackgroundStyle", () => {
  it("returns rgba when color and opacity are set", () => {
    expect(resolveMenuLogoBackgroundStyle("#ffffff", 40)).toBe(
      "rgba(255, 255, 255, 0.4)",
    );
  });

  it("returns undefined for transparent or missing color", () => {
    expect(resolveMenuLogoBackgroundStyle("#ffffff", 0)).toBeUndefined();
    expect(resolveMenuLogoBackgroundStyle(null, 100)).toBeUndefined();
  });
});
