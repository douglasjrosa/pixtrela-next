import { describe, expect, it } from "vitest";

import {
  ENABLED_INTEGRATION_PLUGINS,
  RIBERMAX_PLUGIN_ID,
  isIntegrationEnabled,
} from "./registry";

describe("integration registry", () => {
  it("enables the Ribermax plugin", () => {
    expect(ENABLED_INTEGRATION_PLUGINS).toContain(RIBERMAX_PLUGIN_ID);
    expect(isIntegrationEnabled(RIBERMAX_PLUGIN_ID)).toBe(true);
  });
});
