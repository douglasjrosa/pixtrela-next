import { describe, expect, it } from "vitest";

import { getSemanticThemePreset } from "@/lib/themes/semantic-theme-presets";
import { DEFAULT_SEMANTIC_TOKENS } from "@/lib/themes/semantic-tokens";

import { semanticTokensToRouteThemeColors } from "./semantic-route-theme-colors";

describe("semanticTokensToRouteThemeColors", () => {
  it("maps background and card tokens to route theme colors", () => {
    expect(semanticTokensToRouteThemeColors(DEFAULT_SEMANTIC_TOKENS)).toEqual({
      backgroundColor: "#ffffff",
      backgroundColorOpacity: 100,
      surfaceColor: "#ffffff",
      surfaceColorOpacity: 100,
    });
  });

  it("uses dark palette values for neon", () => {
    const neon = getSemanticThemePreset("neon").tokens;
    expect(semanticTokensToRouteThemeColors(neon)).toEqual({
      backgroundColor: "#0c0614",
      backgroundColorOpacity: 100,
      surfaceColor: "#160b24",
      surfaceColorOpacity: 100,
    });
  });
});
