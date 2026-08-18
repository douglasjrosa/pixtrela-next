import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

vi.mock("@/lib/repos/settings", () => ({
  ensureSemanticThemeSettings: vi.fn(async () => ({})),
  loadSemanticThemeTokens: vi.fn(async () => ({
    primary: "#6d28d9",
    background: "#faf7ff",
  })),
}));

import { loadSemanticThemeTokens } from "@/lib/repos/settings";

import {
  SEMANTIC_THEME_CACHE_TAG,
  loadCachedSemanticThemeTokens,
} from "./load-cached-semantic-theme";

describe("load-cached-semantic-theme", () => {
  it("exposes the cache tag used by theme actions", () => {
    expect(SEMANTIC_THEME_CACHE_TAG).toBe("drizzle:semantic-theme");
  });

  it("loads tokens from the settings repo", async () => {
    const tokens = await loadCachedSemanticThemeTokens();
    expect(loadSemanticThemeTokens).toHaveBeenCalled();
    expect(tokens.primary).toBe("#6d28d9");
  });
});
