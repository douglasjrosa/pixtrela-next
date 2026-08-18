import {
  SEMANTIC_TOKEN_KEYS,
  buildSemanticThemeCss,
  type SemanticTokens,
} from "@/lib/themes/semantic-tokens";

export const SEMANTIC_THEME_STYLE_ID = "semantic-theme";

/** Applies saved palette tokens to the live document without a full reload. */
export function applySemanticThemeToDocument(tokens: SemanticTokens): void {
  if (typeof document === "undefined") return;

  const css = buildSemanticThemeCss(tokens);
  const style = document.getElementById(SEMANTIC_THEME_STYLE_ID);
  if (style) {
    style.textContent = css;
    return;
  }

  const root = document.documentElement;
  for (const key of SEMANTIC_TOKEN_KEYS) {
    root.style.setProperty(`--${key}`, tokens[key]);
  }
}
