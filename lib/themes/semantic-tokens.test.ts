import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEMANTIC_TOKENS,
  SEMANTIC_TOKEN_GROUPS,
  SEMANTIC_TOKEN_KEYS,
  buildSemanticThemeCss,
  mergeSemanticTokens,
  normalizeSemanticHexColor,
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
