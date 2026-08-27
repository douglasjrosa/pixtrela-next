import { describe, expect, it } from "vitest";

import { sampleSubTaskPreset } from "@/test/sample-subtask-preset";

import {
  applySubTaskPreset,
  shouldSearchSubTaskPresets,
  SUBTASK_PRESET_MIN_QUERY_LENGTH,
} from "./subtask-preset";

const preset = sampleSubTaskPreset({
  name: "Corte dos sarrafos",
});

describe("shouldSearchSubTaskPresets", () => {
  it("requires at least the minimum query length after trim", () => {
    expect(shouldSearchSubTaskPresets("")).toBe(false);
    expect(shouldSearchSubTaskPresets("ab")).toBe(false);
    expect(shouldSearchSubTaskPresets(" ab ")).toBe(false);
    expect(shouldSearchSubTaskPresets("abc")).toBe(true);
    expect(shouldSearchSubTaskPresets(" a b ")).toBe(true);
    expect(
      shouldSearchSubTaskPresets("x".repeat(SUBTASK_PRESET_MIN_QUERY_LENGTH)),
    ).toBe(true);
  });
});

describe("applySubTaskPreset", () => {
  it("overwrites only preset fields and keeps the rest", () => {
    const current = {
      name: "Rascunho",
      qty: 5,
      expectedTime: 0,
      sharingType: "duration" as const,
      maxSameTimeWorkers: 1,
      status: "waiting" as const,
      dependencyIds: ["st1"],
      assignedToIds: ["u1"],
      subTaskCategoryId: null,
    };

    expect(applySubTaskPreset(current, preset, 31)).toEqual({
      ...current,
      name: preset.name,
      sharingType: preset.sharingType,
      maxSameTimeWorkers: preset.maxSameTimeWorkers,
      expectedTime: 31,
      subTaskCategoryId: preset.subTaskCategoryId ?? null,
    });
  });
});
