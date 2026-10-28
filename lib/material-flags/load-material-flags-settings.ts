import { cache } from "react";
import { unstable_cache } from "next/cache";

import { areMaterialFlagsEnabled } from "@/lib/business/material-flags-feature";
import { getMaterialFlagsSettings } from "@/lib/repos/material-flags-settings";

export const MATERIAL_FLAGS_SETTINGS_CACHE_TAG =
  "drizzle:materialFlagsSettings";

async function loadMaterialFlagsSettingsFromDb() {
  return getMaterialFlagsSettings();
}

export const loadCachedMaterialFlagsSettings = unstable_cache(
  loadMaterialFlagsSettingsFromDb,
  ["drizzle-material-flags-settings"],
  { tags: [MATERIAL_FLAGS_SETTINGS_CACHE_TAG] },
);

export const loadMaterialFlagsSettings = cache(async () => {
  return loadCachedMaterialFlagsSettings();
});

export async function isMaterialFlagsFeatureEnabled(): Promise<boolean> {
  const settings = await loadMaterialFlagsSettings();
  return areMaterialFlagsEnabled(settings.enabled);
}
