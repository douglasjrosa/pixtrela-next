import { describe, expect, it } from "vitest";

import {
  applySubTaskPreset,
  shouldSearchSubTaskPresets,
  SUBTASK_PRESET_MIN_QUERY_LENGTH,
  type SubTaskPreset,
} from "./subtask-preset";

const preset: SubTaskPreset = {
  documentId: "p1",
  name: "Corte dos sarrafos",
  sharingType: "qty",
  maxSameTimeWorkers: 2,
  expectedTime: 120,
};

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
    };

    expect(applySubTaskPreset(current, preset)).toEqual({
      ...current,
      name: preset.name,
      sharingType: preset.sharingType,
      maxSameTimeWorkers: preset.maxSameTimeWorkers,
      expectedTime: preset.expectedTime,
    });
  });
});
