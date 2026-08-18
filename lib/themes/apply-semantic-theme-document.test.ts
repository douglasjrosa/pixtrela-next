import { describe, expect, it, beforeEach } from "vitest";

import { DEFAULT_SEMANTIC_TOKENS } from "@/lib/themes/semantic-tokens";

import {
  SEMANTIC_THEME_STYLE_ID,
  applySemanticThemeToDocument,
} from "./apply-semantic-theme-document";

describe("applySemanticThemeToDocument", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
    document.getElementById(SEMANTIC_THEME_STYLE_ID)?.remove();
  });

  it("updates the semantic theme style tag when present", () => {
    const style = document.createElement("style");
    style.id = SEMANTIC_THEME_STYLE_ID;
    document.head.appendChild(style);

    applySemanticThemeToDocument({
      ...DEFAULT_SEMANTIC_TOKENS,
      primary: "#6d28d9",
    });

    expect(style.textContent).toContain("--primary: #6d28d9;");
  });

  it("falls back to inline root variables when the style tag is missing", () => {
    applySemanticThemeToDocument({
      ...DEFAULT_SEMANTIC_TOKENS,
      primary: "#6d28d9",
    });

    expect(
      document.documentElement.style.getPropertyValue("--primary").trim(),
    ).toBe("#6d28d9");
  });
});
