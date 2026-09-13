import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const SECRET_ENV_KEYS = [
    "LEGACY_RBX_URL",
  "LEGACY_RBX_TOKEN",
];

const SOURCE_FILES = [
  "app/api/integrations/ribermax/sub-task-presets/route.ts",
  "integrations/ribermax/rbx/rbx-client.ts",
  "integrations/ribermax/rbx/rbx-api-auth.ts",
  "integrations/ribermax/settings/connection-repo.ts",
  "integrations/crm/settings/repo.ts",
];

describe("integration secrets", () => {
  it("does not read RBX or CRM credentials from process.env", () => {
    for (const relative of SOURCE_FILES) {
      const src = readFileSync(path.join(process.cwd(), relative), "utf8");
      for (const key of SECRET_ENV_KEYS) {
        expect(src, `${relative} mentions ${key}`).not.toContain(key);
      }
    }
  });
});
