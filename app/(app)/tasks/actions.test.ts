import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "manager" } })),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch,
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags,
}));

function mockStrapiFetch(
  handlers: Record<string, unknown>,
): void {
  strapiFetch.mockImplementation(
    async (path: string, init?: { method?: string }) => {
      const method = init?.method ?? "GET";
      const key = `${method} ${path}`;
      if (key in handlers) {
        return handlers[key];
      }
      if (path in handlers) {
        return handlers[path];
      }
      throw new Error(`Unexpected strapiFetch: ${key}`);
    },
  );
}

describe("tasks/actions", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
    revalidateStrapiTags.mockReset();
    vi.resetModules();
  });

  it("createTask fetches indexes then POSTs a new task", async () => {
    mockStrapiFetch({
      "GET /tasks": { data: [{ index: 0 }] },
      "POST /tasks": { data: { documentId: "task-new" } },
    });

    const { createTask } = await import("./actions");
    await createTask({
      name: "Tarefa A",
      qty: 1,
      deliveryDate: "",
      stepDocumentId: "step-1",
      status: "waiting",
      templateTaskCode: "",
    });

    expect(strapiFetch).toHaveBeenCalledTimes(2);
    expect(strapiFetch).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.objectContaining({ strapiCache: { noStore: true } }),
      expect.objectContaining({
        filters: { active: { $eq: true } },
      }),
    );
    expect(strapiFetch).toHaveBeenNthCalledWith(
      2,
      "/tasks",
      expect.objectContaining({ method: "POST" }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith(
      "strapi:tasks",
      "strapi:sub-tasks",
      { paths: ["/tasks"] },
    );
  });

  it("updateTask invalidates task list and detail cache", async () => {
    mockStrapiFetch({
      "GET /tasks/task-1": { data: { index: 2 } },
      "PUT /tasks/task-1": { data: { documentId: "task-1" } },
    });

    const { updateTask } = await import("./actions");
    await updateTask("task-1", {
      name: "Tarefa A",
      qty: 1,
      deliveryDate: "",
      stepDocumentId: "step-1",
      status: "waiting",
      templateTaskCode: "",
    });

    expect(revalidateStrapiTags).toHaveBeenCalledWith(
      "strapi:tasks",
      "strapi:sub-tasks",
      { paths: ["/tasks", "/tasks/task-1"] },
    );
  });

  it("lookupTemplateNameByCode returns template name by code", async () => {
    mockStrapiFetch({
      "GET /template-tasks": { data: [{ name: "Modelo A" }] },
    });

    const { lookupTemplateNameByCode } = await import("./actions");
    const result = await lookupTemplateNameByCode("100");

    expect(result).toEqual({ name: "Modelo A" });
    expect(strapiFetch).toHaveBeenCalledWith(
      "/template-tasks",
      expect.objectContaining({ strapiCache: { noStore: true } }),
      expect.objectContaining({
        filters: { code: { $eq: "100" } },
      }),
    );
  });

  it("lookupTemplateNameByCode throws when template is not found", async () => {
    mockStrapiFetch({
      "GET /template-tasks": { data: [] },
    });

    const { lookupTemplateNameByCode } = await import("./actions");
    await expect(lookupTemplateNameByCode("404")).rejects.toThrow("not_found");
  });
});
