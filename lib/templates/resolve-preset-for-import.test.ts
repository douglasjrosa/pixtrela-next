import { beforeEach, describe, expect, it, vi } from "vitest";

const findSubTaskPresetById = vi.fn();
const findSubTaskPresetByName = vi.fn();

vi.mock("@/lib/repos/sub-task-presets", () => ({
  findSubTaskPresetById: (...args: unknown[]) => findSubTaskPresetById(...args),
  findSubTaskPresetByName: (...args: unknown[]) =>
    findSubTaskPresetByName(...args),
}));

import { resolvePresetForImport } from "./resolve-preset-for-import";

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
});
