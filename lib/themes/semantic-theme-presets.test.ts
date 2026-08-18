import { describe, expect, it } from "vitest";

import {
  SEMANTIC_THEME_PRESETS,
  SEMANTIC_THEME_PRESET_IDS,
  getSemanticThemePreset,
} from "./semantic-theme-presets";
import { SEMANTIC_TOKEN_KEYS } from "./semantic-tokens";

describe("semantic-theme-presets", () => {
  it("defines five complete presets", () => {
    expect(SEMANTIC_THEME_PRESET_IDS).toHaveLength(5);
    for (const preset of SEMANTIC_THEME_PRESETS) {
      for (const key of SEMANTIC_TOKEN_KEYS) {
        expect(preset.tokens[key]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("returns preset by id", () => {
    expect(getSemanticThemePreset("ocean").id).toBe("ocean");
  });
});
