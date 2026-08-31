import { describe, expect, it } from "vitest";

import { DEFAULT_FACTORY_ACTIONS } from "@/lib/actions/default-actions";

import { RBX_BOX_TEMPLATE_PRESET_SEEDS } from "./rbx-box-template-presets";

describe("RBX_BOX_TEMPLATE_PRESET_SEEDS", () => {
  it("maps every preset to an existing factory action", () => {
    const actionNames = new Set(DEFAULT_FACTORY_ACTIONS.map((row) => row.name));

    for (const preset of RBX_BOX_TEMPLATE_PRESET_SEEDS) {
      expect(actionNames.has(preset.actionName), preset.name).toBe(true);
    }
  });

  it("uses unique preset names", () => {
    const names = RBX_BOX_TEMPLATE_PRESET_SEEDS.map((row) => row.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
