import { unstable_cache } from "next/cache";

import {
  ensureSemanticThemeSettings,
  loadSemanticThemeTokens,
} from "@/lib/repos/settings";
import type { SemanticTokens } from "@/lib/themes/semantic-tokens";

export const SEMANTIC_THEME_CACHE_TAG = "drizzle:semantic-theme";

async function loadSemanticThemeTokensFromDb(): Promise<SemanticTokens> {
  await ensureSemanticThemeSettings();
  return loadSemanticThemeTokens();
}

export const loadCachedSemanticThemeTokens = unstable_cache(
  loadSemanticThemeTokensFromDb,
  ["drizzle-semantic-theme-tokens"],
  { tags: [SEMANTIC_THEME_CACHE_TAG] },
);
