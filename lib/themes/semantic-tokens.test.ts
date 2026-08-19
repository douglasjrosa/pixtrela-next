import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEMANTIC_TOKENS,
  SEMANTIC_TOKEN_GROUPS,
  SEMANTIC_TOKEN_KEYS,
  buildSemanticThemeCss,
  mergeSemanticTokens,
  normalizeSemanticHexColor,
  resolveSelectOptionCssVars,
} from "./semantic-tokens";
import { parseSemanticTokens } from "@/lib/schemas/semantic-theme";

describe("semantic-tokens", () => {
  it("covers every token key in groups", () => {
    const grouped = new Set(
      SEMANTIC_TOKEN_GROUPS.flatMap((group) => group.keys),
    );
    for (const key of SEMANTIC_TOKEN_KEYS) {
      expect(grouped.has(key)).toBe(true);
    }
  });

  it("builds :root CSS from tokens", () => {
    const css = buildSemanticThemeCss(DEFAULT_SEMANTIC_TOKENS);
    expect(css).toContain(":root {");
    expect(css).toContain("--primary: #4a7fd4;");
    expect(css).toContain("--foreground: #002555;");
    expect(css).toContain("color-scheme: light;");
  });

  it("uses dark color-scheme for dark backgrounds", () => {
    const css = buildSemanticThemeCss({
      ...DEFAULT_SEMANTIC_TOKENS,
      background: "#0f172a",
    });
    expect(css).toContain("color-scheme: dark;");
    expect(css).toContain("--select-option-background: #0f172a;");
  });

  it("falls back to background when card stays light on a dark palette", () => {
    expect(
      resolveSelectOptionCssVars({
        ...DEFAULT_SEMANTIC_TOKENS,
        background: "#0f172a",
        foreground: "#e2e8f0",
        card: "#ffffff",
        primary: "#22d3ee",
        "primary-foreground": "#0f172a",
      }),
    ).toEqual({
      "select-option-background": "#0f172a",
      "select-option-foreground": "#e2e8f0",
      "select-option-highlight-background": "#22d3ee",
      "select-option-highlight-foreground": "#0f172a",
    });
  });

  it("uses card background for select options when card is also dark", () => {
    expect(
      resolveSelectOptionCssVars({
        ...DEFAULT_SEMANTIC_TOKENS,
        background: "#0f172a",
        foreground: "#e2e8f0",
        card: "#1e293b",
        primary: "#22d3ee",
        "primary-foreground": "#0f172a",
      }),
    ).toEqual({
      "select-option-background": "#1e293b",
      "select-option-foreground": "#e2e8f0",
      "select-option-highlight-background": "#22d3ee",
      "select-option-highlight-foreground": "#0f172a",
    });
  });

  it("merges partial tokens with defaults", () => {
    expect(
      mergeSemanticTokens({ primary: "#112233" }).primary,
    ).toBe("#112233");
    expect(mergeSemanticTokens({ primary: "#112233" }).background).toBe(
      DEFAULT_SEMANTIC_TOKENS.background,
    );
  });

  it("normalizes 3-digit hex colors", () => {
    expect(normalizeSemanticHexColor("#abc")).toBe("#aabbcc");
  });

  it("parses partial input through schema", () => {
    const tokens = parseSemanticTokens({ primary: "#112233" });
    expect(tokens.primary).toBe("#112233");
    expect(tokens.background).toBe(DEFAULT_SEMANTIC_TOKENS.background);
  });
});
