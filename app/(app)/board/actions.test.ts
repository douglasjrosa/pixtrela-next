import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const updateTaskBoardFields = vi.fn();
const listStepsRepo = vi.fn();
const listBoardSubtaskRows = vi.fn();
const getTaskById = vi.fn();
const getSubTaskById = vi.fn();
const listSubTasksWithRelationsForTask = vi.fn();
const updateSubTaskLinkedToPrevious = vi.fn();
const replaceSubTaskAssignees = vi.fn();
const applyAutoStepTaskOrderingAfterTaskChange = vi.fn();
const createSubTask = vi.fn();
const updateSubTask = vi.fn();
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "mgr-1", role: "manager" },
    jwt: "",
  })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
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
  getSubTaskById: (...args: unknown[]) => getSubTaskById(...args),
  listSubTasksWithRelationsForTask: (...args: unknown[]) =>
    listSubTasksWithRelationsForTask(...args),
  updateSubTaskLinkedToPrevious: (...args: unknown[]) =>
    updateSubTaskLinkedToPrevious(...args),
  replaceSubTaskAssignees: (...args: unknown[]) =>
    replaceSubTaskAssignees(...args),
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
    getSubTaskById.mockReset();
    listSubTasksWithRelationsForTask.mockReset();
    updateSubTaskLinkedToPrevious.mockReset();
    replaceSubTaskAssignees.mockReset();
    updateSubTask.mockReset();
    applyAutoStepTaskOrderingAfterTaskChange.mockReset();
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
      { documentId: "task-1", index: 0, stepId: 0 },
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
    expect(result[0]?.linkedToPrevious).toBe(false);
    expect(result[0]?.maxSameTimeWorkers).toBe(1);
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
      stepId: 0,
      index: 2,
      name: "Caixa",
      qty: 4,
      deliveryDate: "2026-08-01",
      endedAt: null,
    });
  });

  it("updateBoardSubtaskLink copies previous assignees when linking", async () => {
    listSubTasksWithRelationsForTask.mockResolvedValue([
      {
        id: "st-1",
        index: 0,
        status: "waiting",
        activationStatus: "unlocked",
        linkedToPrevious: false,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
      {
        id: "st-2",
        index: 1,
        status: "waiting",
        activationStatus: "unlocked",
        linkedToPrevious: false,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-old"],
        dependencyIds: [],
      },
    ]);
    listBoardSubtaskRows.mockResolvedValue({
      rows: [
        {
          id: "st-2",
          name: "Cortar",
          status: "waiting",
          sharingType: "duration",
          qty: 1,
          expectedTime: 0,
          timeSpent: 0,
          linkedToPrevious: true,
        },
      ],
      assigneeRows: [
        { subTaskId: "st-2", userId: "u-head", name: "Head" },
      ],
      activityRows: [],
    });

    const { updateBoardSubtaskLink } = await import("./actions");
    const result = await updateBoardSubtaskLink("task-1", "st-2", true);

    expect(updateSubTaskLinkedToPrevious).toHaveBeenCalledWith("st-2", true);
    expect(replaceSubTaskAssignees).toHaveBeenCalledWith("st-2", ["u-head"]);
    expect(result).toEqual({
      documentId: "st-2",
      linkedToPrevious: true,
      assignedTo: [{ documentId: "u-head", name: "Head" }],
    });
  });

  it("updateBoardSubtaskLink unlinks without clearing assignees", async () => {
    listSubTasksWithRelationsForTask.mockResolvedValue([
      {
        id: "st-1",
        index: 0,
        status: "waiting",
        activationStatus: "unlocked",
        linkedToPrevious: false,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
      {
        id: "st-2",
        index: 1,
        status: "waiting",
        activationStatus: "unlocked",
        linkedToPrevious: true,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
    ]);
    listBoardSubtaskRows.mockResolvedValue({
      rows: [
        {
          id: "st-2",
          name: "Cortar",
          status: "waiting",
          sharingType: "duration",
          qty: 1,
          expectedTime: 0,
          timeSpent: 0,
          linkedToPrevious: false,
        },
      ],
      assigneeRows: [
        { subTaskId: "st-2", userId: "u-head", name: "Head" },
      ],
      activityRows: [],
    });

    const { updateBoardSubtaskLink } = await import("./actions");
    await updateBoardSubtaskLink("task-1", "st-2", false);

    expect(updateSubTaskLinkedToPrevious).toHaveBeenCalledWith("st-2", false);
    expect(replaceSubTaskAssignees).not.toHaveBeenCalled();
  });

  it("updateBoardSubtaskAssignees propagates head assignees to chain members", async () => {
    const siblings = [
      {
        id: "st-1",
        taskId: "task-1",
        name: "Cut",
        qty: 1,
        expectedTime: 10,
        sharingType: "duration",
        index: 0,
        status: "waiting",
        activationStatus: "unlocked",
        reasonForDeactivation: null,
        linkedToPrevious: false,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
      {
        id: "st-2",
        taskId: "task-1",
        name: "Pack",
        qty: 1,
        expectedTime: 10,
        sharingType: "duration",
        index: 1,
        status: "waiting",
        activationStatus: "unlocked",
        reasonForDeactivation: null,
        linkedToPrevious: true,
        maxSameTimeWorkers: 2,
        assignedToIds: ["u-head", "u-helper"],
        dependencyIds: [],
      },
    ];
    listSubTasksWithRelationsForTask.mockResolvedValue(siblings);
    getSubTaskById.mockImplementation(async (id: string) =>
      siblings.find((row) => row.id === id) ?? null,
    );

    const { updateBoardSubtaskAssignees } = await import("./actions");
    await updateBoardSubtaskAssignees("st-1", "task-1", ["u-head", "u-new"]);

    expect(updateSubTask).toHaveBeenCalledTimes(2);
    expect(updateSubTask).toHaveBeenNthCalledWith(
      1,
      "st-1",
      "task-1",
      expect.objectContaining({ assignedToIds: ["u-head", "u-new"] }),
    );
    expect(updateSubTask).toHaveBeenNthCalledWith(
      2,
      "st-2",
      "task-1",
      expect.objectContaining({
        assignedToIds: ["u-head", "u-new"],
      }),
    );
  });

  it("updateBoardSubtaskAssignees rejects locked chain members", async () => {
    listSubTasksWithRelationsForTask.mockResolvedValue([
      {
        id: "st-1",
        index: 0,
        status: "waiting",
        activationStatus: "unlocked",
        linkedToPrevious: false,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
      {
        id: "st-2",
        index: 1,
        status: "waiting",
        activationStatus: "unlocked",
        linkedToPrevious: true,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
    ]);

    const { updateBoardSubtaskAssignees } = await import("./actions");
    await expect(
      updateBoardSubtaskAssignees("st-2", "task-1", ["u-other"]),
    ).rejects.toThrow("forbidden");
    expect(updateSubTask).not.toHaveBeenCalled();
  });

  it("updateBoardSubtaskAssignees keeps head ids on a helper patch", async () => {
    const siblings = [
      {
        id: "st-1",
        taskId: "task-1",
        name: "Cut",
        qty: 1,
        expectedTime: 10,
        sharingType: "duration",
        index: 0,
        status: "waiting",
        activationStatus: "unlocked",
        reasonForDeactivation: null,
        linkedToPrevious: false,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
      {
        id: "st-2",
        taskId: "task-1",
        name: "Pack",
        qty: 1,
        expectedTime: 10,
        sharingType: "duration",
        index: 1,
        status: "waiting",
        activationStatus: "unlocked",
        reasonForDeactivation: null,
        linkedToPrevious: true,
        maxSameTimeWorkers: 2,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
    ];
    listSubTasksWithRelationsForTask.mockResolvedValue(siblings);
    getSubTaskById.mockImplementation(async (id: string) =>
      siblings.find((row) => row.id === id) ?? null,
    );

    const { updateBoardSubtaskAssignees } = await import("./actions");
    await updateBoardSubtaskAssignees("st-2", "task-1", ["u-extra"]);

    expect(updateSubTask).toHaveBeenCalledWith(
      "st-2",
      "task-1",
      expect.objectContaining({ assignedToIds: ["u-head", "u-extra"] }),
    );
  });
});
