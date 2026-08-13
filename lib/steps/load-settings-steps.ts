import { unstable_cache } from "next/cache";

import { listSteps } from "@/lib/repos/steps";

export const loadCachedSettingsSteps = unstable_cache(
  async () => listSteps(),
  ["drizzle-settings-steps"],
  { tags: ["drizzle:steps"] },
);
