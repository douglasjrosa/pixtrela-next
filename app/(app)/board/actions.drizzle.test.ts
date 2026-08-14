import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const updateTaskBoardFields = vi.fn();
const listStepsRepo = vi.fn();
const listBoardSubtaskRows = vi.fn();
const getTaskById = vi.fn();
const applyAutoStepTaskOrderingAfterTaskChange = vi.fn();
const createSubTask = vi.fn();
const updateSubTask = vi.fn();
const isDrizzleBackend = vi.fn(() => true);

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "mgr-1", role: "manager" },
    jwt: "",
  })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => isDrizzleBackend(),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch: vi.fn(),
  STRAPI_TAGS: {
    tasks: "strapi:tasks",
    steps: "strapi:steps",
    subTasks: "strapi:sub-tasks",
  },
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags: vi.fn(),
}));

vi.mock("@/lib/board/load-board-progress", () => ({
  loadBoardProgressByTaskId: vi.fn(async () => ({
    progressByTaskId: {},
    badgesByTaskId: {},
    assignedCountByColaboratorId: {},
  })),
}));

vi.mock("@/app/(app)/tasks/[documentId]/actions", () => ({
  createSubTask: (...args: unknown[]) => createSubTask(...args),
  updateSubTask: (...args: unknown[]) => updateSubTask(...args),
}));

vi.mock("@/lib/repos/steps", () => ({
  listSteps: (...args: unknown[]) => listStepsRepo(...args),
}));

vi.mock("@/lib/repos/tasks", () => ({
  updateTaskBoardFields: (...args: unknown[]) => updateTaskBoardFields(...args),
  listBoardSubtaskRows: (...args: unknown[]) => listBoardSubtaskRows(...args),
  getTaskById: (...args: unknown[]) => getTaskById(...args),
  getSubTaskById: vi.fn(),
  listSubTasksWithRelationsForTask: vi.fn(),
}));

vi.mock("@/lib/business/apply-step-task-order", () => ({
  applyAutoStepTaskOrderingAfterTaskChange: (...args: unknown[]) =>
    applyAutoStepTaskOrderingAfterTaskChange(...args),
}));

describe("board/actions drizzle", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    updateTaskBoardFields.mockReset();
    listStepsRepo.mockReset();
    listBoardSubtaskRows.mockReset();
    getTaskById.mockReset();
    applyAutoStepTaskOrderingAfterTaskChange.mockReset();
    isDrizzleBackend.mockReturnValue(true);
    listStepsRepo.mockResolvedValue([
      { id: "step-uuid", name: "Produção", index: 1, taskOrderBy: "manual" },
    ]);
    getTaskById.mockResolvedValue({
      stepId: "step-uuid",
      deliveryDate: "2026-08-01",
    });
  });

  it("applyBoardTaskOrder maps kanban step id to uuid", async () => {
    const { applyBoardTaskOrder } = await import("./actions");
    await applyBoardTaskOrder([
      { documentId: "task-1", index: 0, stepId: 1 },
    ]);
    expect(updateTaskBoardFields).toHaveBeenCalledWith("task-1", {
      index: 0,
      stepId: "step-uuid",
    });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:tasks", "default");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:steps", "default");
  });

  it("loadBoardSubtasks reads drizzle bundle", async () => {
    listBoardSubtaskRows.mockResolvedValue({
      rows: [
        {
          id: "sub-1",
          name: "Corte",
          status: "waiting",
          sharingType: "duration",
          qty: 1,
          expectedTime: 60,
          timeSpent: 0,
        },
      ],
      assigneeRows: [],
      activityRows: [],
    });

    const { loadBoardSubtasks } = await import("./actions");
    const result = await loadBoardSubtasks("task-1");
    expect(listBoardSubtaskRows).toHaveBeenCalledWith("task-1");
    expect(result[0]?.documentId).toBe("sub-1");
  });

  it("pollBoardProgress loads totals and layout from task repo", async () => {
    getTaskById.mockResolvedValue({
      status: "producing",
      stepId: "step-uuid",
      index: 2,
      name: "Caixa",
      qty: 4,
      deliveryDate: "2026-08-01",
      endedAt: null,
      totalTimeSpent: 10,
      totalExpectedTime: 100,
    });

    const { pollBoardProgress } = await import("./actions");
    const snapshot = await pollBoardProgress([
      { documentId: "task-1", status: "waiting" },
    ]);
    expect(snapshot.totalsByTaskId["task-1"]).toEqual({
      totalTimeSpent: 10,
      totalExpectedTime: 100,
    });
    expect(snapshot.layoutByTaskId["task-1"]).toEqual({
      status: "producing",
      stepId: 1,
      index: 2,
      name: "Caixa",
      qty: 4,
      deliveryDate: "2026-08-01",
      endedAt: null,
    });
  });
});
