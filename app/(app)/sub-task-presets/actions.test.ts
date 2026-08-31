import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SAMPLE_ACTION_ID,
  sampleSubTaskPreset,
} from "@/test/sample-subtask-preset";

const searchSubTaskPresetsByName = vi.fn();
const listSubTaskPresetsRepo = vi.fn();
const createSubTaskPresetRepo = vi.fn();
const updateSubTaskPresetRepo = vi.fn();
const archiveSubTaskPresetById = vi.fn();
const auth = vi.fn(async () => ({ user: { role: "manager" } }));
const revalidateTag = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/repos/sub-task-presets", () => ({
  searchSubTaskPresetsByName: (...args: unknown[]) =>
    searchSubTaskPresetsByName(...args),
  listSubTaskPresetsRepo: (...args: unknown[]) => listSubTaskPresetsRepo(...args),
  createSubTaskPresetRepo: (...args: unknown[]) =>
    createSubTaskPresetRepo(...args),
  updateSubTaskPresetRepo: (...args: unknown[]) =>
    updateSubTaskPresetRepo(...args),
  archiveSubTaskPresetById: (...args: unknown[]) =>
    archiveSubTaskPresetById(...args),
}));

const loadSubtaskPresetListPageMock = vi.fn();

vi.mock("@/lib/subtask-presets/load-subtask-preset-list-page", () => ({
  loadSubtaskPresetListPage: (...args: unknown[]) =>
    loadSubtaskPresetListPageMock(...args),
}));

describe("sub-task-presets actions", () => {
  beforeEach(() => {
    searchSubTaskPresetsByName.mockReset();
    listSubTaskPresetsRepo.mockReset();
    loadSubtaskPresetListPageMock.mockReset();
    createSubTaskPresetRepo.mockReset();
    updateSubTaskPresetRepo.mockReset();
    archiveSubTaskPresetById.mockReset();
    auth.mockReset();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
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
      sampleSubTaskPreset({
        documentId: "p1",
        name: "Corte dos sarrafos",
      }),
    ]);

    const { searchSubTaskPresets } = await import("./actions");
    const result = await searchSubTaskPresets("cor");

    expect(result).toHaveLength(1);
    expect(searchSubTaskPresetsByName).toHaveBeenCalledWith("cor");
  });

  it("listSubTaskPresets returns ordered presets", async () => {
    listSubTaskPresetsRepo.mockResolvedValue([
      sampleSubTaskPreset({
        documentId: "p1",
        name: "A",
        maxSameTimeWorkers: 1,
      }),
    ]);

    const { listSubTaskPresets } = await import("./actions");
    await expect(listSubTaskPresets()).resolves.toHaveLength(1);
  });

  it("loadMoreSubTaskPresets parses filters and loads a page", async () => {
    loadSubtaskPresetListPageMock.mockResolvedValueOnce({
      presets: [],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });
    const { loadMoreSubTaskPresets } = await import("./actions");
    await loadMoreSubTaskPresets({ column: "name", direction: "asc" }, 2);
    expect(loadSubtaskPresetListPageMock).toHaveBeenCalledWith(
      { column: "name", direction: "asc", q: undefined, showArchived: false },
      2,
    );
  });

  it("createSubTaskPreset persists and returns documentId", async () => {
    createSubTaskPresetRepo.mockResolvedValue("p-new");
    const { createSubTaskPreset } = await import("./actions");
    const id = await createSubTaskPreset({
      name: "Corte",
      sharingType: "duration",
      maxSameTimeWorkers: 2,
      actionId: SAMPLE_ACTION_ID,
    });
    expect(id).toBe("p-new");
    expect(revalidateTag).toHaveBeenCalledWith(
      "drizzle:sub-task-presets",
      "default",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/templates/subtasks");
  });

  it("updateSubTaskPreset updates repo row", async () => {
    const { updateSubTaskPreset } = await import("./actions");
    await updateSubTaskPreset("p1", {
      name: "Corte",
      sharingType: "qty",
      maxSameTimeWorkers: 1,
      actionId: SAMPLE_ACTION_ID,
    });
    expect(updateSubTaskPresetRepo).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ name: "Corte" }),
    );
  });

  it("deleteSubTaskPreset deletes by id", async () => {
    const { deleteSubTaskPreset } = await import("./actions");
    await deleteSubTaskPreset("p1");
    expect(archiveSubTaskPresetById).toHaveBeenCalledWith("p1");
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
