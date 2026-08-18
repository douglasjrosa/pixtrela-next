import {
  ensureSemanticThemeSettings,
  loadSemanticThemeTokens,
} from "@/lib/repos/settings";
import {
  buildSemanticThemeCss,
  type SemanticTokens,
} from "@/lib/themes/semantic-tokens";

export async function loadSemanticThemeCss(): Promise<string> {
  await ensureSemanticThemeSettings();
  const tokens = await loadSemanticThemeTokens();
  return buildSemanticThemeCss(tokens);
}

export async function loadSemanticThemeForSettings(): Promise<SemanticTokens> {
  await ensureSemanticThemeSettings();
  return loadSemanticThemeTokens();
}
