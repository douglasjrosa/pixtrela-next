import {
  SELECT_OPTION_CSS_VAR_KEYS,
  SEMANTIC_TOKEN_KEYS,
  buildSemanticThemeCss,
  resolveSelectOptionCssVars,
  resolveSemanticColorScheme,
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
  const selectOptionVars = resolveSelectOptionCssVars(tokens);
  root.style.setProperty(
    "color-scheme",
    resolveSemanticColorScheme(tokens.background),
  );
  for (const key of SEMANTIC_TOKEN_KEYS) {
    root.style.setProperty(`--${key}`, tokens[key]);
  }
  for (const key of SELECT_OPTION_CSS_VAR_KEYS) {
    root.style.setProperty(`--${key}`, selectOptionVars[key]);
  }
}
