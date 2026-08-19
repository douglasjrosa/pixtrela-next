import { cache } from "react";
import { unstable_cache } from "next/cache";

import {
  loadResolvedBrandingAssets,
  type ResolvedBrandingAssets,
} from "@/lib/repos/branding";

const loadBrandingCached = unstable_cache(
  async (): Promise<ResolvedBrandingAssets> => loadResolvedBrandingAssets(),
  ["app-branding-assets"],
  { tags: ["drizzle:branding"], revalidate: 60 },
);

/** Deduped branding assets for the current request. */
export const loadBrandingForLayout = cache(async () => loadBrandingCached());
