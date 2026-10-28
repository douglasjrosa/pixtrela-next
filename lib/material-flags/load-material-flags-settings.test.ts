import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: (fn: () => unknown) => fn,
  };
});

vi.mock("@/lib/repos/material-flags-settings", () => ({
  getMaterialFlagsSettings: vi.fn(async () => ({ id: "s1", enabled: true })),
}));

import { getMaterialFlagsSettings } from "@/lib/repos/material-flags-settings";

import {
  MATERIAL_FLAGS_SETTINGS_CACHE_TAG,
  isMaterialFlagsFeatureEnabled,
} from "./load-material-flags-settings";

describe("load-material-flags-settings", () => {
  it("exposes the cache tag used by the toggle action", () => {
    expect(MATERIAL_FLAGS_SETTINGS_CACHE_TAG).toBe(
      "drizzle:materialFlagsSettings",
    );
  });

  it("reads enabled from settings", async () => {
    await expect(isMaterialFlagsFeatureEnabled()).resolves.toBe(true);
    expect(getMaterialFlagsSettings).toHaveBeenCalled();
  });
});
