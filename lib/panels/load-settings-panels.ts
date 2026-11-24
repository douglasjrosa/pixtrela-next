import { unstable_cache } from "next/cache";

import { listPanels } from "@/lib/repos/panels";

export const loadCachedSettingsPanels = unstable_cache(
  async () => listPanels(),
  ["drizzle-settings-panels"],
  { tags: ["drizzle:panels"] },
);
