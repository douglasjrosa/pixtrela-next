import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createSubTaskForTask = vi.fn();
const updateSubTaskFields = vi.fn();
const updateSubTaskIndex = vi.fn();
const deleteSubTaskById = vi.fn();
const listSubTasksWithRelationsForTask = vi.fn();
const listSubTaskIdsForTask = vi.fn();
const getSubTaskById = vi.fn();
const isDrizzleBackend = vi.fn(() => true);

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" } })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => isDrizzleBackend(),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch: vi.fn(),
  STRAPI_TAGS: { subTasks: "strapi:sub-tasks", tasks: "strapi:tasks" },
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags: vi.fn(),
}));

vi.mock("@/lib/strapi/subtask-sessions", () => ({
  loadSubTaskSessions: vi.fn(),
}));

vi.mock("@/lib/repos/tasks", () => ({
  createSubTaskForTask: (...args: unknown[]) => createSubTaskForTask(...args),
  updateSubTaskFields: (...args: unknown[]) => updateSubTaskFields(...args),
  updateSubTaskIndex: (...args: unknown[]) => updateSubTaskIndex(...args),
  deleteSubTaskById: (...args: unknown[]) => deleteSubTaskById(...args),
  listSubTasksWithRelationsForTask: (...args: unknown[]) =>
    listSubTasksWithRelationsForTask(...args),
  listSubTaskIdsForTask: (...args: unknown[]) => listSubTaskIdsForTask(...args),
  getSubTaskById: (...args: unknown[]) => getSubTaskById(...args),
}));

describe("tasks/[documentId]/actions drizzle subtasks", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    createSubTaskForTask.mockReset();
    updateSubTaskFields.mockReset();
    updateSubTaskIndex.mockReset();
    deleteSubTaskById.mockReset();
    listSubTasksWithRelationsForTask.mockReset();
    listSubTaskIdsForTask.mockReset();
    getSubTaskById.mockReset();
    isDrizzleBackend.mockReturnValue(true);
  });

  const values = {
    name: "Corte",
    qty: 1,
    expectedTime: 60,
    sharingType: "duration" as const,
    maxSameTimeWorkers: 1,
    status: "waiting" as const,
    dependencyIds: [],
    activationStatus: "unlocked" as const,
    reasonForDisabling: "",
    assignedToIds: ["user-1"],
  };

  it("createSubTask persists via repo", async () => {
    listSubTasksWithRelationsForTask.mockResolvedValue([]);
    createSubTaskForTask.mockResolvedValue({ id: "sub-1" });

    const { createSubTask } = await import("./actions");
    await createSubTask("task-1", values);

    expect(createSubTaskForTask).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({ name: "Corte" }),
      0,
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:tasks", "default");
  });

  it("updateSubTask persists via repo", async () => {
    getSubTaskById.mockResolvedValue({ index: 2 });

    const { updateSubTask } = await import("./actions");
    await updateSubTask("sub-1", "task-1", values);

    expect(updateSubTaskFields).toHaveBeenCalledWith(
      "sub-1",
      "task-1",
      expect.objectContaining({ name: "Corte" }),
      2,
    );
  });

  it("reorderSubTasks updates indexes via repo", async () => {
    listSubTaskIdsForTask.mockResolvedValue(["a", "b"]);
    const { reorderSubTasks } = await import("./actions");
    await reorderSubTasks("task-1", ["b", "a"]);
    expect(updateSubTaskIndex).toHaveBeenCalledWith("b", 0, "task-1");
    expect(updateSubTaskIndex).toHaveBeenCalledWith("a", 1, "task-1");
  });

  it("deleteSubTask removes via repo", async () => {
    const { deleteSubTask } = await import("./actions");
    await deleteSubTask("sub-1");
    expect(deleteSubTaskById).toHaveBeenCalledWith("sub-1");
  });
});
