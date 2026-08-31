import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn(async () => ({ user: { role: "manager" } }));
const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const createFactoryActionRepo = vi.fn();
const updateFactoryActionRepo = vi.fn();
const archiveFactoryActionById = vi.fn();
const searchFactoryActionsByName = vi.fn();

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/repos/factory-actions", () => ({
  createFactoryActionRepo: (...args: unknown[]) =>
    createFactoryActionRepo(...args),
  updateFactoryActionRepo: (...args: unknown[]) =>
    updateFactoryActionRepo(...args),
  archiveFactoryActionById: (...args: unknown[]) =>
    archiveFactoryActionById(...args),
  searchFactoryActionsByName: (...args: unknown[]) =>
    searchFactoryActionsByName(...args),
}));

vi.mock("@/lib/factory-actions/load-factory-action-list-page", () => ({
  loadFactoryActionListPage: vi.fn(),
}));

describe("factory-actions actions", () => {
  beforeEach(() => {
    auth.mockReset();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    createFactoryActionRepo.mockReset();
    updateFactoryActionRepo.mockReset();
    archiveFactoryActionById.mockReset();
    searchFactoryActionsByName.mockReset();
    auth.mockResolvedValue({ user: { role: "manager" } });
    vi.resetModules();
  });

  it("searchFactoryActions returns empty when the query is short", async () => {
    const { searchFactoryActions } = await import("./actions");
    await expect(searchFactoryActions("ab")).resolves.toEqual([]);
    expect(searchFactoryActionsByName).not.toHaveBeenCalled();
  });

  it("createFactoryAction persists and invalidates", async () => {
    createFactoryActionRepo.mockResolvedValue("a1");
    const { createFactoryAction } = await import("./actions");
    const id = await createFactoryAction({
      name: "Grampear",
      description: "staple",
      unitTime: 1,
      qtyQuestion: "How many?",
    });
    expect(id).toBe("a1");
    expect(revalidateTag).toHaveBeenCalledWith(
      "drizzle:factory-actions",
      "default",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/templates/actions");
  });

  it("deleteFactoryAction deletes by id", async () => {
    const { deleteFactoryAction } = await import("./actions");
    await deleteFactoryAction("a1");
    expect(archiveFactoryActionById).toHaveBeenCalledWith("a1");
  });
});
