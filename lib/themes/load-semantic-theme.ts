import {
  buildSemanticThemeCss,
  type SemanticTokens,
} from "@/lib/themes/semantic-tokens";
import { loadCachedSemanticThemeTokens } from "@/lib/themes/load-cached-semantic-theme";

export async function loadSemanticThemeCss(): Promise<string> {
  const tokens = await loadCachedSemanticThemeTokens();
  return buildSemanticThemeCss(tokens);
}

export async function loadSemanticThemeForSettings(): Promise<SemanticTokens> {
  return loadCachedSemanticThemeTokens();
}
