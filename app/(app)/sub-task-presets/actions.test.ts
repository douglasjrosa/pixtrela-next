import { beforeEach, describe, expect, it, vi } from "vitest";

const searchSubTaskPresetsByName = vi.fn();
const listSubTaskPresetsRepo = vi.fn();
const createSubTaskPresetRepo = vi.fn();
const updateSubTaskPresetRepo = vi.fn();
const deleteSubTaskPresetById = vi.fn();
const auth = vi.fn(async () => ({ user: { role: "manager" } }));
const revalidateTag = vi.fn();

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/sub-task-presets", () => ({
  searchSubTaskPresetsByName: (...args: unknown[]) =>
    searchSubTaskPresetsByName(...args),
  listSubTaskPresetsRepo: (...args: unknown[]) => listSubTaskPresetsRepo(...args),
  createSubTaskPresetRepo: (...args: unknown[]) =>
    createSubTaskPresetRepo(...args),
  updateSubTaskPresetRepo: (...args: unknown[]) =>
    updateSubTaskPresetRepo(...args),
  deleteSubTaskPresetById: (...args: unknown[]) =>
    deleteSubTaskPresetById(...args),
}));

describe("sub-task-presets actions", () => {
  beforeEach(() => {
    searchSubTaskPresetsByName.mockReset();
    listSubTaskPresetsRepo.mockReset();
    createSubTaskPresetRepo.mockReset();
    updateSubTaskPresetRepo.mockReset();
    deleteSubTaskPresetById.mockReset();
    auth.mockReset();
    revalidateTag.mockReset();
    auth.mockResolvedValue({ user: { role: "manager" } });
    vi.resetModules();
  });

  it("searchSubTaskPresets returns empty without calling repo when query is short", async () => {
    const { searchSubTaskPresets } = await import("./actions");
    await expect(searchSubTaskPresets("ab")).resolves.toEqual([]);
    expect(searchSubTaskPresetsByName).not.toHaveBeenCalled();
  });

  it("searchSubTaskPresets searches presets by name", async () => {
    searchSubTaskPresetsByName.mockResolvedValue([
      {
        documentId: "p1",
        name: "Corte dos sarrafos",
        sharingType: "qty",
        maxSameTimeWorkers: 2,
        expectedTime: 120,
      },
    ]);

    const { searchSubTaskPresets } = await import("./actions");
    const result = await searchSubTaskPresets("cor");

    expect(result).toHaveLength(1);
    expect(searchSubTaskPresetsByName).toHaveBeenCalledWith("cor");
  });

  it("listSubTaskPresets returns ordered presets", async () => {
    listSubTaskPresetsRepo.mockResolvedValue([
      {
        documentId: "p1",
        name: "A",
        sharingType: "qty",
        maxSameTimeWorkers: 1,
        expectedTime: 10,
      },
    ]);

    const { listSubTaskPresets } = await import("./actions");
    await expect(listSubTaskPresets()).resolves.toHaveLength(1);
  });

  it("createSubTaskPreset persists and returns documentId", async () => {
    createSubTaskPresetRepo.mockResolvedValue("p-new");
    const { createSubTaskPreset } = await import("./actions");
    const id = await createSubTaskPreset({
      name: "Corte",
      sharingType: "duration",
      maxSameTimeWorkers: 2,
      expectedTime: 60,
    });
    expect(id).toBe("p-new");
    expect(revalidateTag).toHaveBeenCalledWith(
      "drizzle:sub-task-presets",
      "default",
    );
  });

  it("updateSubTaskPreset updates repo row", async () => {
    const { updateSubTaskPreset } = await import("./actions");
    await updateSubTaskPreset("p1", {
      name: "Corte",
      sharingType: "qty",
      maxSameTimeWorkers: 1,
      expectedTime: 30,
    });
    expect(updateSubTaskPresetRepo).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ name: "Corte" }),
    );
  });

  it("deleteSubTaskPreset deletes by id", async () => {
    const { deleteSubTaskPreset } = await import("./actions");
    await deleteSubTaskPreset("p1");
    expect(deleteSubTaskPresetById).toHaveBeenCalledWith("p1");
  });

  it("rejects leader from managing presets", async () => {
    auth.mockResolvedValue({ user: { role: "leader" } });
    const { listSubTaskPresets } = await import("./actions");
    await expect(listSubTaskPresets()).rejects.toThrow("forbidden");
  });

  it("rejects unauthorized roles from search", async () => {
    auth.mockResolvedValue({ user: { role: "colaborator" } });
    const { searchSubTaskPresets } = await import("./actions");
    await expect(searchSubTaskPresets("corte")).rejects.toThrow("forbidden");
  });
});
