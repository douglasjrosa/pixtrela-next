import { describe, expect, it } from "vitest";

import { canonicalRbxBoxImportPresetName } from "@/lib/subtask-presets/rbx-box-template-presets";

describe("canonicalRbxBoxImportPresetName", () => {
  it("keeps canonical RBX preset names", () => {
    expect(canonicalRbxBoxImportPresetName("Corte das vigas")).toBe(
      "Corte das vigas",
    );
  });

  it("maps legacy alias names to canonical catalog names", () => {
    expect(
      canonicalRbxBoxImportPresetName("Corte dos pés da base (viga)"),
    ).toBe("Corte das vigas");
  });

  it("returns null for unknown preset names", () => {
    expect(canonicalRbxBoxImportPresetName("Preset inexistente")).toBeNull();
  });
});
