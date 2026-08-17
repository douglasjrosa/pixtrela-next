import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createTaskRepo = vi.fn();
const updateTaskFields = vi.fn();
const setTaskActive = vi.fn();
const deleteTaskById = vi.fn();
const listTasksRepo = vi.fn();
const getTaskById = vi.fn();
const findTemplateByCode = vi.fn();
const loadTaskListPage = vi.fn();
const applyAutoStepTaskOrderingAfterTaskChange = vi.fn();
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" } })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/tasks", () => ({
  createTask: (...args: unknown[]) => createTaskRepo(...args),
  updateTaskFields: (...args: unknown[]) => updateTaskFields(...args),
  setTaskActive: (...args: unknown[]) => setTaskActive(...args),
  deleteTaskById: (...args: unknown[]) => deleteTaskById(...args),
  listTasks: (...args: unknown[]) => listTasksRepo(...args),
  getTaskById: (...args: unknown[]) => getTaskById(...args),
}));

vi.mock("@/lib/repos/templates", () => ({
  findTemplateByCode: (...args: unknown[]) => findTemplateByCode(...args),
}));

vi.mock("@/lib/tasks/load-task-list-page", () => ({
  loadTaskListPage: (...args: unknown[]) => loadTaskListPage(...args),
}));

vi.mock("@/lib/business/apply-step-task-order", () => ({
  applyAutoStepTaskOrderingAfterTaskChange: (...args: unknown[]) =>
    applyAutoStepTaskOrderingAfterTaskChange(...args),
}));

describe("tasks/actions drizzle CRUD", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    createTaskRepo.mockReset();
    updateTaskFields.mockReset();
    setTaskActive.mockReset();
    deleteTaskById.mockReset();
    listTasksRepo.mockReset();
    getTaskById.mockReset();
    findTemplateByCode.mockReset();
    loadTaskListPage.mockReset();
    applyAutoStepTaskOrderingAfterTaskChange.mockReset();
  });

  const form = {
    name: "Montagem",
    qty: 2,
    deliveryDate: "2026-07-18",
    stepDocumentId: "step-1",
    status: "waiting" as const,
    templateTaskCode: "",
  };

  it("createTask uses repo and revalidates drizzle tag", async () => {
    listTasksRepo.mockResolvedValue([{ index: 1 }]);
    createTaskRepo.mockResolvedValue({ id: "task-1" });

    const { createTask } = await import("./actions");
    await createTask(form);

    expect(createTaskRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Montagem",
        qty: 2,
        stepId: "step-1",
        index: 2,
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:tasks", "default");
  });

  it("updateTask updates fields without step", async () => {
    getTaskById
      .mockResolvedValueOnce({
        index: 3,
        stepId: "step-1",
        deliveryDate: "2026-07-18",
      })
      .mockResolvedValueOnce({
        index: 3,
        stepId: "step-1",
        deliveryDate: "2026-07-18",
      });

    const { updateTask } = await import("./actions");
    await updateTask("task-1", { ...form, status: "producing" });

    expect(updateTaskFields).toHaveBeenCalledWith("task-1", {
      name: "Montagem",
      qty: 2,
      deliveryDate: "2026-07-18",
      status: "producing",
      templateTaskCode: null,
    });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:tasks", "default");
  });

  it("deactivateTask sets active false via repo", async () => {
    const reason = "x".repeat(100);
    const { deactivateTask } = await import("./actions");
    await deactivateTask("task-1", reason);
    expect(setTaskActive).toHaveBeenCalledWith("task-1", false, reason);
  });

  it("deleteTask hard-deletes via repo", async () => {
    const { deleteTask } = await import("./actions");
    await deleteTask("task-1");
    expect(deleteTaskById).toHaveBeenCalledWith("task-1");
  });

  it("bulkDeactivateTasks archives each selected task with shared reason", async () => {
    getTaskById.mockResolvedValue({ active: true });
    const reason = "x".repeat(50);
    const { bulkDeactivateTasks } = await import("./actions");
    await bulkDeactivateTasks(["task-1", "task-2"], reason);
    expect(setTaskActive).toHaveBeenCalledTimes(2);
    expect(setTaskActive).toHaveBeenCalledWith("task-1", false, reason);
    expect(setTaskActive).toHaveBeenCalledWith("task-2", false, reason);
  });

  it("bulkDeleteTasks deletes only inactive tasks", async () => {
    getTaskById.mockResolvedValue({ active: false });
    const { bulkDeleteTasks } = await import("./actions");
    await bulkDeleteTasks(["task-1", "task-2"]);
    expect(deleteTaskById).toHaveBeenCalledTimes(2);
    expect(deleteTaskById).toHaveBeenCalledWith("task-1");
    expect(deleteTaskById).toHaveBeenCalledWith("task-2");
  });

  it("bulkDeleteTasks rejects active tasks", async () => {
    getTaskById.mockResolvedValue({ active: true });
    const { bulkDeleteTasks } = await import("./actions");
    await expect(bulkDeleteTasks(["task-1"])).rejects.toThrow("activeTask");
    expect(deleteTaskById).not.toHaveBeenCalled();
  });

  it("lookupTemplateNameByCode reads template repo", async () => {
    findTemplateByCode.mockResolvedValue({ name: "Modelo A" });
    const { lookupTemplateNameByCode } = await import("./actions");
    await expect(lookupTemplateNameByCode("100")).resolves.toEqual({
      name: "Modelo A",
    });
  });

  it("loadMoreTasks delegates to loadTaskListPage", async () => {
    loadTaskListPage.mockResolvedValue({
      tasks: [],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });
    const filters = { statuses: ["waiting"], from: "2026-06-01" };
    const { loadMoreTasks } = await import("./actions");
    const result = await loadMoreTasks(filters, 2);
    expect(loadTaskListPage).toHaveBeenCalledWith(filters, 2);
    expect(result.page).toBe(2);
  });
});
