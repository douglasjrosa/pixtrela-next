import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createTemplateTaskRepo = vi.fn();
const updateTemplateTaskRepo = vi.fn();
const deleteTemplateTaskRepo = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/templates", () => ({
  createTemplateTask: (...args: unknown[]) => createTemplateTaskRepo(...args),
  updateTemplateTask: (...args: unknown[]) => updateTemplateTaskRepo(...args),
  deleteTemplateTask: (...args: unknown[]) => deleteTemplateTaskRepo(...args),
}));

vi.mock("@/lib/legacy/rbx-client", () => ({
  fetchBoxTemplateData: vi.fn(),
}));

vi.mock("@/lib/templates/load-template-list-page", () => ({
  loadTemplateListPage: vi.fn(),
}));

describe("templates/actions drizzle CRUD", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    createTemplateTaskRepo.mockReset();
    updateTemplateTaskRepo.mockReset();
    deleteTemplateTaskRepo.mockReset();
  });

  it("createTemplate returns repo id", async () => {
    createTemplateTaskRepo.mockResolvedValue({ id: "tpl-1" });
    const { createTemplate } = await import("./actions");
    const id = await createTemplate({ name: "Montagem", code: "100" });
    expect(id).toBe("tpl-1");
    expect(createTemplateTaskRepo).toHaveBeenCalledWith({
      name: "Montagem",
      code: "100",
      subTasks: [],
    });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:templates", "default");
  });

  it("updateTemplate persists subtasks via repo", async () => {
    const { updateTemplate } = await import("./actions");
    await updateTemplate("tpl-1", {
      name: "Montagem",
      code: "100",
      subTask: [
        {
          name: "Corte",
          qty: 1,
          sharingType: "duration",
          maxSameTimeWorkers: 1,
          index: 0,
          expectedTime: 60,
          dependencies: null,
        },
      ],
    });
    expect(updateTemplateTaskRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "tpl-1",
        subTasks: [
          expect.objectContaining({
            name: "Corte",
            index: 0,
            expectedTime: 60,
          }),
        ],
      }),
    );
  });

  it("deleteTemplate removes via repo", async () => {
    const { deleteTemplate } = await import("./actions");
    await deleteTemplate("tpl-1");
    expect(deleteTemplateTaskRepo).toHaveBeenCalledWith("tpl-1");
  });
});
