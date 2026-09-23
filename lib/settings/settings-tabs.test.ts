import { describe, expect, it } from "vitest";

import { SETTINGS_TAB_DEFS } from "@/lib/settings/settings-tabs";

describe("settings tabs", () => {
  it("places logs first, to the left of files", () => {
    expect(SETTINGS_TAB_DEFS[0]?.href).toBe("/settings/logs");
    expect(SETTINGS_TAB_DEFS[1]?.href).toBe("/settings/files");
    expect(SETTINGS_TAB_DEFS[0]?.labelKey).toBe("tabs.logs");
  });
});
