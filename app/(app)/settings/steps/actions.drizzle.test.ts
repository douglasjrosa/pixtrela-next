import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createStepRepo = vi.fn();
const updateStepName = vi.fn();
const updateStepIndex = vi.fn();
const deleteStepRepo = vi.fn();
const listStepsRepo = vi.fn();
const isDrizzleBackend = vi.fn(() => true);

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => isDrizzleBackend(),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { steps: "strapi:steps" },
  strapiFetch: vi.fn(),
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags: vi.fn(),
}));

vi.mock("@/lib/repos/steps", () => ({
  createStep: (...args: unknown[]) => createStepRepo(...args),
  updateStepName: (...args: unknown[]) => updateStepName(...args),
  updateStepIndex: (...args: unknown[]) => updateStepIndex(...args),
  deleteStep: (...args: unknown[]) => deleteStepRepo(...args),
  listSteps: (...args: unknown[]) => listStepsRepo(...args),
}));

describe("settings/steps/actions drizzle CRUD", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    createStepRepo.mockReset();
    updateStepName.mockReset();
    updateStepIndex.mockReset();
    deleteStepRepo.mockReset();
    listStepsRepo.mockReset();
    isDrizzleBackend.mockReturnValue(true);
  });

  it("createStep uses repo and revalidates drizzle tag", async () => {
    listStepsRepo.mockResolvedValue([{ id: "s1", name: "A", index: 2 }]);
    createStepRepo.mockResolvedValue({ id: "s2", name: "B", index: 3 });

    const { createStep } = await import("./actions");
    await createStep({ name: "B" });

    expect(createStepRepo).toHaveBeenCalledWith({ name: "B", index: 3 });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:steps");
  });

  it("updateStep renames via repo", async () => {
    const { updateStep } = await import("./actions");
    await updateStep("s1", { name: "Produção" });
    expect(updateStepName).toHaveBeenCalledWith("s1", "Produção");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:steps");
  });

  it("reorderSteps updates indexes via repo", async () => {
    listStepsRepo.mockResolvedValue([
      { id: "a", name: "A", index: 0 },
      { id: "b", name: "B", index: 1 },
    ]);
    const { reorderSteps } = await import("./actions");
    await reorderSteps(["b", "a"]);
    expect(updateStepIndex).toHaveBeenCalledWith("b", 0);
    expect(updateStepIndex).toHaveBeenCalledWith("a", 1);
  });

  it("deleteStep calls repo hard delete", async () => {
    const { deleteStep } = await import("./actions");
    await deleteStep("s1");
    expect(deleteStepRepo).toHaveBeenCalledWith("s1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:steps");
  });
});
