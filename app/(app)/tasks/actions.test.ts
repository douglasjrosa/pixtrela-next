import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "manager" } })),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch,
  STRAPI_TAGS: { tasks: "strapi:tasks" },
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
      deliveryDate: "2026-07-18",
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
      { paths: ["/tasks", "/board"] },
    );
  });

  it("updateTask PUT omits step so status→step automation can apply", async () => {
    mockStrapiFetch({
      "GET /tasks/task-1": { data: { index: 2 } },
      "PUT /tasks/task-1": { data: { documentId: "task-1" } },
    });

    const { updateTask } = await import("./actions");
    await updateTask("task-1", {
      name: "Tarefa A",
      qty: 1,
      deliveryDate: "2026-07-18",
      stepDocumentId: "step-old",
      status: "producing",
      templateTaskCode: "",
    });

    expect(strapiFetch).toHaveBeenNthCalledWith(
      2,
      "/tasks/task-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          data: {
            name: "Tarefa A",
            qty: 1,
            deliveryDate: "2026-07-18",
            index: 2,
            status: "producing",
            templateTaskCode: null,
            active: true,
          },
        }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith(
      "strapi:tasks",
      "strapi:sub-tasks",
      { paths: ["/tasks", "/board", "/tasks/task-1"] },
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
      deliveryDate: "2026-07-18",
      stepDocumentId: "step-1",
      status: "waiting",
      templateTaskCode: "",
    });

    expect(revalidateStrapiTags).toHaveBeenCalledWith(
      "strapi:tasks",
      "strapi:sub-tasks",
      { paths: ["/tasks", "/board", "/tasks/task-1"] },
    );
  });

  it("deactivateTask requires a valid reason and archives the task", async () => {
    mockStrapiFetch({
      "PUT /tasks/task-1": { data: { documentId: "task-1" } },
    });

    const { deactivateTask } = await import("./actions");
    const reason = "x".repeat(100);
    await deactivateTask("task-1", reason);

    expect(strapiFetch).toHaveBeenCalledWith(
      "/tasks/task-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          data: { active: false, reasonForDeactivation: reason },
        }),
      }),
    );
  });

  it("deactivateTask rejects short reasons", async () => {
    const { deactivateTask } = await import("./actions");
    await expect(deactivateTask("task-1", "curta")).rejects.toThrow();
    expect(strapiFetch).not.toHaveBeenCalled();
  });

  it("reactivateTask requires a valid reason and restores the task", async () => {
    mockStrapiFetch({
      "PUT /tasks/task-1": { data: { documentId: "task-1" } },
    });

    const { reactivateTask } = await import("./actions");
    const reason = "y".repeat(100);
    await reactivateTask("task-1", reason);

    expect(strapiFetch).toHaveBeenCalledWith(
      "/tasks/task-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          data: { active: true, reasonForDeactivation: reason },
        }),
      }),
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

  it("loadMoreTasks returns the next filtered page", async () => {
    mockStrapiFetch({
      "GET /tasks": {
        data: [
          {
            documentId: "t2",
            name: "Embalagem",
            qty: 1,
            index: 1,
            status: "producing",
            deliveryDate: "2026-07-10",
          },
        ],
        meta: {
          pagination: { page: 2, pageSize: 10, pageCount: 2, total: 11 },
        },
      },
    });

    const { loadMoreTasks } = await import("./actions");
    const result = await loadMoreTasks(
      { statuses: ["producing", "waiting"], from: "2026-06-01" },
      2,
    );

    expect(result.page).toBe(2);
    expect(result.hasMore).toBe(false);
    expect(result.tasks[0]?.name).toBe("Embalagem");
  });
});
