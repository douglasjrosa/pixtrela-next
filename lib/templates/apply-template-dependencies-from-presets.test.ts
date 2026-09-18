import { describe, expect, it } from "vitest";

import { applyTemplateDependenciesFromPresets } from "./apply-template-dependencies-from-presets";

const draft = (name: string, index: number) => ({
  name,
  qty: 1,
  sharingType: "qty" as const,
  maxSameTimeWorkers: 1,
  index,
  expectedTime: 10,
  dependencies: null,
  subTaskCategoryId: null,
});

describe("applyTemplateDependenciesFromPresets", () => {
  it("maps preset default dependencies to template subtask indexes", () => {
    const presetIds = ["cut", "assemble", "fix"];
    const defaults = new Map<string, readonly string[]>([
      ["assemble", ["cut"]],
      ["fix", ["assemble", "cut"]],
    ]);

    const result = applyTemplateDependenciesFromPresets(
      [draft("Cut", 0), draft("Assemble", 1), draft("Fix", 2)],
      presetIds,
      defaults,
    );

    expect(result[0]?.dependencies).toBeNull();
    expect(result[1]?.dependencies).toEqual([0]);
    expect(result[2]?.dependencies).toEqual([1, 0]);
  });

  it("skips dependencies missing from the imported subtask list", () => {
    const presetIds = ["assemble"];
    const defaults = new Map<string, readonly string[]>([
      ["assemble", ["cut", "missing"]],
    ]);

    const result = applyTemplateDependenciesFromPresets(
      [draft("Assemble", 0)],
      presetIds,
      defaults,
    );

    expect(result[0]?.dependencies).toBeNull();
  });

  it("uses the first occurrence when the same preset appears twice", () => {
    const presetIds = ["cut", "cut", "assemble"];
    const defaults = new Map<string, readonly string[]>([
      ["assemble", ["cut"]],
    ]);

    const result = applyTemplateDependenciesFromPresets(
      [draft("Cut A", 0), draft("Cut B", 1), draft("Assemble", 2)],
      presetIds,
      defaults,
    );

    expect(result[2]?.dependencies).toEqual([0]);
  });
});
