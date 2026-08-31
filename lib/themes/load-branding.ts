import { cache } from "react";
import { unstable_cache } from "next/cache";

import {
  loadResolvedBranding,
  type ResolvedBranding,
} from "@/lib/repos/branding";

const loadBrandingCached = unstable_cache(
  async (): Promise<ResolvedBranding> => loadResolvedBranding(),
  ["app-branding-slots"],
  { tags: ["drizzle:branding"], revalidate: 60 },
);

/** Deduped branding slots for the current request. */
export const loadBrandingForLayout = cache(async () => loadBrandingCached());
