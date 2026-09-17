import { beforeEach, describe, expect, it, vi } from "vitest";

const findSubTaskPresetById = vi.fn();
const findSubTaskPresetByName = vi.fn();
const ensureRbxBoxTemplatePresetByImportName = vi.fn();

vi.mock("@/lib/repos/sub-task-presets", () => ({
  findSubTaskPresetById: (...args: unknown[]) => findSubTaskPresetById(...args),
  findSubTaskPresetByName: (...args: unknown[]) =>
    findSubTaskPresetByName(...args),
}));

vi.mock("@/lib/subtask-presets/rbx-box-template-presets", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/subtask-presets/rbx-box-template-presets")
  >();
  return {
    ...actual,
    ensureRbxBoxTemplatePresetByImportName: (...args: unknown[]) =>
      ensureRbxBoxTemplatePresetByImportName(...args),
  };
});

import {
  resolvePresetByName,
  resolvePresetForImport,
} from "./resolve-preset-for-import";

const preset = {
  documentId: "p1",
  name: "Montagem dos pés",
  sharingType: "qty" as const,
  maxSameTimeWorkers: 1,
  actionId: "a1",
  actionName: "Pregar",
  actionUnitTime: 1,
  actionQtyQuestion: "",
  active: true,
};

describe("resolvePresetForImport", () => {
  beforeEach(() => {
    findSubTaskPresetById.mockReset();
    findSubTaskPresetByName.mockReset();
    ensureRbxBoxTemplatePresetByImportName.mockReset();
    ensureRbxBoxTemplatePresetByImportName.mockResolvedValue(null);
  });

  it("prefers presetId over presetName", async () => {
    findSubTaskPresetById.mockResolvedValue(preset);
    const result = await resolvePresetForImport({
      presetId: "p1",
      presetName: "Other",
    });
    expect(result).toEqual(preset);
    expect(findSubTaskPresetByName).not.toHaveBeenCalled();
  });

  it("falls back to presetName when presetId misses", async () => {
    findSubTaskPresetById.mockResolvedValue(null);
    findSubTaskPresetByName.mockResolvedValue(preset);
    const result = await resolvePresetForImport({
      presetId: "missing",
      presetName: "Montagem dos pés",
    });
    expect(result).toEqual(preset);
    expect(findSubTaskPresetByName).toHaveBeenCalledWith("Montagem dos pés");
  });

  it("resolves legacy RBX sub-task names to canonical presets", async () => {
    findSubTaskPresetByName.mockImplementation(async (name: string) => {
      if (name === "Corte dos sarrafos") {
        return { ...preset, name: "Corte dos sarrafos", subTaskCategoryId: "cat-1" };
      }
      return null;
    });

    const result = await resolvePresetByName("Corte dos sarrafos da embalagem");

    expect(result?.name).toBe("Corte dos sarrafos");
    expect(result?.subTaskCategoryId).toBe("cat-1");
    expect(findSubTaskPresetByName).toHaveBeenCalledWith(
      "Corte dos sarrafos da embalagem",
    );
    expect(findSubTaskPresetByName).toHaveBeenCalledWith("Corte dos sarrafos");
  });

  it("seeds RBX catalog presets when lookup and aliases miss", async () => {
    findSubTaskPresetById.mockResolvedValue(null);
    findSubTaskPresetByName.mockResolvedValue(null);
    ensureRbxBoxTemplatePresetByImportName.mockResolvedValue(preset);

    const result = await resolvePresetForImport({
      presetName: "Corte das vigas",
    });

    expect(result).toEqual(preset);
    expect(ensureRbxBoxTemplatePresetByImportName).toHaveBeenCalledWith(
      "Corte das vigas",
    );
  });
});
