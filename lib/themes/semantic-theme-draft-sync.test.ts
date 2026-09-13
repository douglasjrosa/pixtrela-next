import { describe, expect, it } from "vitest";

import { getSemanticThemePreset } from "@/lib/themes/semantic-theme-presets";
import { DEFAULT_SEMANTIC_TOKENS } from "@/lib/themes/semantic-tokens";

import { shouldReplaceDraftFromServer } from "./semantic-theme-draft-sync";

describe("shouldReplaceDraftFromServer", () => {
  it("accepts the first server snapshot", () => {
    expect(
      shouldReplaceDraftFromServer({
        serverTokens: DEFAULT_SEMANTIC_TOKENS,
        draft: DEFAULT_SEMANTIC_TOKENS,
        savedBaseline: DEFAULT_SEMANTIC_TOKENS,
      }),
    ).toBe(true);
  });

  it("keeps the saved palette when refresh still returns the previous tokens", () => {
    const ocean = getSemanticThemePreset("ocean").tokens;
    expect(
      shouldReplaceDraftFromServer({
        serverTokens: DEFAULT_SEMANTIC_TOKENS,
        draft: ocean,
        savedBaseline: ocean,
      }),
    ).toBe(false);
  });

  it("accepts the server palette once it matches the save", () => {
    const ocean = getSemanticThemePreset("ocean").tokens;
    expect(
      shouldReplaceDraftFromServer({
        serverTokens: ocean,
        draft: ocean,
        savedBaseline: ocean,
      }),
    ).toBe(true);
  });
});
