import { describe, expect, it } from "vitest";

import {
  normalizeDefaultDependencyPresetIds,
  PRESET_DEFAULT_DEPENDENCY_NAMES,
} from "./preset-default-dependencies-seed";

describe("preset default dependencies seed", () => {
  it("keeps the legacy RBX graph for assembly and fixation presets", () => {
    expect(PRESET_DEFAULT_DEPENDENCY_NAMES["Montagem dos pés"]).toContain(
      "Corte dos sarrafos",
    );
    expect(
      PRESET_DEFAULT_DEPENDENCY_NAMES["Fixação dos adesivos das laterais"],
    ).toEqual(["Fixação das chapas das laterais"]);
  });

  it("treats a missing dependency list as empty", () => {
    expect(normalizeDefaultDependencyPresetIds(undefined)).toEqual([]);
    expect(normalizeDefaultDependencyPresetIds(null)).toEqual([]);
  });

  it("removes self references when normalizing dependency ids", () => {
    expect(
      normalizeDefaultDependencyPresetIds(
        ["a", "b", "a", "a"],
        "a",
      ),
    ).toEqual(["b"]);
  });
});
