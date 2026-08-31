import { describe, expect, it } from "vitest";

import {
  defaultBrandingSlotConfig,
  normalizeBrandingSlotConfig,
  resolveBrandingBackgroundStyle,
  resolveCartWatermarkStyle,
} from "./branding-slots";

describe("branding-slots domain", () => {
  it("defaults cart watermark display values", () => {
    expect(defaultBrandingSlotConfig("cart_watermark")).toEqual({
      displayOpacity: 70,
      widthPercent: 50,
    });
  });

  it("parses menu logo background config", () => {
    expect(
      normalizeBrandingSlotConfig("menu_logo", {
        backgroundColor: "#ffffff",
        backgroundColorOpacity: 40,
        displayOpacity: 99,
      }),
    ).toEqual({
      backgroundColor: "#ffffff",
      backgroundColorOpacity: 40,
    });
  });

  it("rejects invalid menu logo colors", () => {
    expect(
      normalizeBrandingSlotConfig("menu_logo", {
        backgroundColor: "white",
      }),
    ).toEqual({});
  });

  it("resolves rgba background style", () => {
    expect(
      resolveBrandingBackgroundStyle({
        backgroundColor: "#ffffff",
        backgroundColorOpacity: 40,
      }),
    ).toBe("rgba(255, 255, 255, 0.4)");
  });

  it("resolves cart watermark display style with defaults", () => {
    expect(resolveCartWatermarkStyle({})).toEqual({
      opacity: 70,
      widthPercent: 50,
    });
  });
});
