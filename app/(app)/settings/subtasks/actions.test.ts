import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const findSubTaskCategoryById = vi.fn();
const deleteSubTaskCategory = vi.fn();
const findMaterialFlagById = vi.fn();
const deleteMaterialFlag = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/repos/sub-task-categories", () => ({
  findSubTaskCategoryById: (...args: unknown[]) =>
    findSubTaskCategoryById(...args),
  deleteSubTaskCategory: (...args: unknown[]) =>
    deleteSubTaskCategory(...args),
  createSubTaskCategory: vi.fn(),
  listSubTaskCategories: vi.fn(),
  updateSubTaskCategory: vi.fn(),
  listAllSubTaskCategories: vi.fn(),
}));

vi.mock("@/lib/repos/material-flags", () => ({
  findMaterialFlagById: (...args: unknown[]) => findMaterialFlagById(...args),
  deleteMaterialFlag: (...args: unknown[]) => deleteMaterialFlag(...args),
  createMaterialFlag: vi.fn(),
  createMaterialFlagsInRange: vi.fn(),
  listMaterialFlags: vi.fn(),
  nextFlagIndexForCategory: vi.fn(),
  updateMaterialFlag: vi.fn(),
}));

vi.mock("@/lib/subtasks/category-options", () => ({
  loadSubTaskCategoryOptions: vi.fn(),
}));

describe("settings/subtasks bulk delete", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidatePath.mockReset();
    findSubTaskCategoryById.mockReset();
    deleteSubTaskCategory.mockReset();
    findMaterialFlagById.mockReset();
    deleteMaterialFlag.mockReset();
  });

  it("bulkDeleteCategories hard-deletes each selected category", async () => {
    findSubTaskCategoryById.mockResolvedValue({
      id: "c1",
      name: "Madeira",
      ref: "MAD",
    });

    const { bulkDeleteCategories } = await import("./actions");
    await bulkDeleteCategories(["c1", "c2"]);

    expect(findSubTaskCategoryById).toHaveBeenCalledWith("c1");
    expect(findSubTaskCategoryById).toHaveBeenCalledWith("c2");
    expect(deleteSubTaskCategory).toHaveBeenCalledWith("c1");
    expect(deleteSubTaskCategory).toHaveBeenCalledWith("c2");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/settings/subtasks",
      "layout",
    );
  });

  it("bulkDeleteCategories rejects a missing category", async () => {
    findSubTaskCategoryById.mockResolvedValueOnce(null);

    const { bulkDeleteCategories } = await import("./actions");
    await expect(bulkDeleteCategories(["missing"])).rejects.toThrow(
      "notFound",
    );
    expect(deleteSubTaskCategory).not.toHaveBeenCalled();
  });

  it("bulkDeleteFlags hard-deletes each selected flag", async () => {
    findMaterialFlagById.mockResolvedValue({
      id: "f1",
      code: "MAD-1",
      occupied: false,
    });

    const { bulkDeleteFlags } = await import("./actions");
    await bulkDeleteFlags(["f1", "f2"]);

    expect(findMaterialFlagById).toHaveBeenCalledWith("f1");
    expect(findMaterialFlagById).toHaveBeenCalledWith("f2");
    expect(deleteMaterialFlag).toHaveBeenCalledWith("f1");
    expect(deleteMaterialFlag).toHaveBeenCalledWith("f2");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/settings/subtasks",
      "layout",
    );
  });

  it("bulkDeleteFlags rejects a missing flag", async () => {
    findMaterialFlagById.mockResolvedValueOnce(null);

    const { bulkDeleteFlags } = await import("./actions");
    await expect(bulkDeleteFlags(["missing"])).rejects.toThrow("notFound");
    expect(deleteMaterialFlag).not.toHaveBeenCalled();
  });
});
