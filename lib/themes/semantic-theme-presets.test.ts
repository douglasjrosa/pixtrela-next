import { describe, expect, it } from "vitest";

import {
  SEMANTIC_THEME_PRESETS,
  SEMANTIC_THEME_PRESET_IDS,
  getSemanticThemePreset,
} from "./semantic-theme-presets";
import { SEMANTIC_TOKEN_KEYS } from "./semantic-tokens";

describe("semantic-theme-presets", () => {
  it("defines ten complete presets", () => {
    expect(SEMANTIC_THEME_PRESET_IDS).toHaveLength(10);
    for (const preset of SEMANTIC_THEME_PRESETS) {
      for (const key of SEMANTIC_TOKEN_KEYS) {
        expect(preset.tokens[key]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("returns preset by id", () => {
    expect(getSemanticThemePreset("ocean").id).toBe("ocean");
    expect(getSemanticThemePreset("midnight").tokens.background).toBe(
      "#0f172a",
    );
    expect(getSemanticThemePreset("neon").tokens.primary).toBe("#d946ef");
  });
});
