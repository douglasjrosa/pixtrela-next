import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const updateTaskBoardFields = vi.fn();
const listStepsRepo = vi.fn();
const listBoardSubtaskCore = vi.fn();
const listBoardSubtaskOpenActivities = vi.fn();
const listBoardSubTasksForTask = vi.fn();
const listBoardSubtaskSessionHistory = vi.fn();
const listBoardSubtaskAssignees = vi.fn();
const listSubTaskActivitySessions = vi.fn();
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
  unstable_cache: (fn: () => unknown) => fn,
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

vi.mock("@/lib/repos/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repos/tasks")>();
  return {
    ...actual,
    updateTaskBoardFields: (...args: unknown[]) => updateTaskBoardFields(...args),
    listBoardSubtaskCore: (...args: unknown[]) => listBoardSubtaskCore(...args),
    listBoardSubtaskOpenActivities: (...args: unknown[]) =>
      listBoardSubtaskOpenActivities(...args),
    listBoardSubTasksForTask: (...args: unknown[]) =>
      listBoardSubTasksForTask(...args),
    listBoardSubtaskSessionHistory: (...args: unknown[]) =>
      listBoardSubtaskSessionHistory(...args),
    listBoardSubtaskAssignees: (...args: unknown[]) =>
      listBoardSubtaskAssignees(...args),
    listSubTaskActivitySessions: (...args: unknown[]) =>
      listSubTaskActivitySessions(...args),
    getTaskById: (...args: unknown[]) => getTaskById(...args),
    getSubTaskById: (...args: unknown[]) => getSubTaskById(...args),
    listSubTasksWithRelationsForTask: (...args: unknown[]) =>
      listSubTasksWithRelationsForTask(...args),
    updateSubTaskLinkedToPrevious: (...args: unknown[]) =>
      updateSubTaskLinkedToPrevious(...args),
    replaceSubTaskAssignees: (...args: unknown[]) =>
      replaceSubTaskAssignees(...args),
  };
});

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
    listBoardSubtaskCore.mockReset();
    listBoardSubtaskOpenActivities.mockReset();
    listBoardSubTasksForTask.mockReset();
    listBoardSubtaskSessionHistory.mockReset();
    listBoardSubtaskAssignees.mockReset();
    listSubTaskActivitySessions.mockReset();
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

  it("loadBoardSubtasks reads cached core without live producing fields", async () => {
    listBoardSubtaskCore.mockResolvedValue({
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
    });

    const { loadBoardSubtasks } = await import("./actions");
    const result = await loadBoardSubtasks("task-1");
    expect(listBoardSubtaskCore).toHaveBeenCalledWith("task-1");
    expect(result[0]?.documentId).toBe("sub-1");
    expect(result[0]?.linkedToPrevious).toBe(false);
    expect(result[0]?.maxSameTimeWorkers).toBe(1);
    expect(result[0]?.sessions).toEqual([]);
    expect(result[0]?.producingColaboratorIds).toEqual([]);
  });

  it("loadBoardSubtaskLive maps open activities", async () => {
    listBoardSubTasksForTask.mockResolvedValue([{ id: "sub-1" }]);
    listBoardSubtaskOpenActivities.mockResolvedValue([
      {
        subTaskId: "sub-1",
        colaboratorId: "u-1",
        colaboratorName: "Ana",
        action: "started",
        timestamp: new Date("2026-07-16T11:00:00.000Z"),
        qty: 0,
      },
    ]);

    const { loadBoardSubtaskLive } = await import("./actions");
    const live = await loadBoardSubtaskLive("task-1");
    expect(listBoardSubtaskOpenActivities).toHaveBeenCalledWith(["sub-1"]);
    expect(live["sub-1"]?.producingColaboratorIds).toEqual(["u-1"]);
  });

  it("loadBoardSubtaskSessions loads history for finished subtasks only", async () => {
    listBoardSubTasksForTask.mockResolvedValue([
      { id: "sub-pending", status: "waiting" },
      { id: "sub-done", status: "finished" },
    ]);
    listBoardSubtaskSessionHistory.mockResolvedValue([
      {
        subTaskId: "sub-done",
        colaboratorId: "u-1",
        colaboratorName: "Ana",
        action: "started",
        timestamp: new Date("2026-07-16T10:00:00.000Z"),
        qty: 0,
      },
      {
        subTaskId: "sub-done",
        colaboratorId: "u-1",
        colaboratorName: "Ana",
        action: "stoped",
        timestamp: new Date("2026-07-16T10:01:00.000Z"),
        qty: 0,
      },
    ]);

    const { loadBoardSubtaskSessions } = await import("./actions");
    const result = await loadBoardSubtaskSessions("task-1");

    expect(listBoardSubtaskSessionHistory).toHaveBeenCalledWith(["sub-done"]);
    expect(result["sub-done"]).toHaveLength(1);
    expect(result["sub-pending"]).toBeUndefined();
  });

  it("loadBoardSubtaskSession delegates to listSubTaskActivitySessions", async () => {
    listSubTaskActivitySessions.mockResolvedValue([
      {
        colaboratorDocumentId: "u-1",
        colaboratorName: "Ana",
        startedAt: "2026-07-16T10:00:00.000Z",
        finishedAt: "2026-07-16T10:01:00.000Z",
        durationSec: 60,
        qty: 0,
      },
    ]);

    const { loadBoardSubtaskSession } = await import("./actions");
    const result = await loadBoardSubtaskSession("sub-1");

    expect(listSubTaskActivitySessions).toHaveBeenCalledWith("sub-1");
    expect(result).toHaveLength(1);
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
    listBoardSubtaskAssignees.mockResolvedValue([
      { subTaskId: "st-2", userId: "u-head", name: "Head" },
    ]);

    const { updateBoardSubtaskLink } = await import("./actions");
    const result = await updateBoardSubtaskLink("task-1", "st-2", true);

    expect(updateSubTaskLinkedToPrevious).toHaveBeenCalledWith("st-2", true);
    expect(replaceSubTaskAssignees).toHaveBeenCalledWith("st-2", ["u-head"]);
    expect(result).toEqual({
      documentId: "st-2",
      linkedToPrevious: true,
      assignedTo: [{ documentId: "u-head", name: "Head" }],
    });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:subTasks", "default");
    expect(revalidateTag).toHaveBeenCalledWith(
      "board-subtasks:task-1",
      "default",
    );
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
    listBoardSubtaskAssignees.mockResolvedValue([
      { subTaskId: "st-2", userId: "u-head", name: "Head" },
    ]);

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

  it("updateBoardSubtaskAssignees can update only the head", async () => {
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
        linkedToPrevious: false,
        maxSameTimeWorkers: 2,
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
        linkedToPrevious: true,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
    ];
    listSubTasksWithRelationsForTask.mockResolvedValue(siblings);
    getSubTaskById.mockImplementation(async (id: string) =>
      siblings.find((row) => row.id === id) ?? null,
    );

    const { updateBoardSubtaskAssignees } = await import("./actions");
    await updateBoardSubtaskAssignees(
      "st-1",
      "task-1",
      ["u-head", "u-new"],
      false,
    );

    expect(updateSubTask).toHaveBeenCalledTimes(1);
    expect(updateSubTask).toHaveBeenCalledWith(
      "st-1",
      "task-1",
      expect.objectContaining({ assignedToIds: ["u-head", "u-new"] }),
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

  it("updateBoardSubtaskAssignees strips shared removals from the group", async () => {
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
        linkedToPrevious: false,
        maxSameTimeWorkers: 2,
        assignedToIds: ["u-head", "u-extra"],
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
        linkedToPrevious: true,
        maxSameTimeWorkers: 1,
        assignedToIds: ["u-head"],
        dependencyIds: [],
      },
    ];
    listSubTasksWithRelationsForTask.mockResolvedValue(siblings);
    getSubTaskById.mockImplementation(async (id: string) =>
      siblings.find((row) => row.id === id) ?? null,
    );

    const { updateBoardSubtaskAssignees } = await import("./actions");
    await updateBoardSubtaskAssignees("st-1", "task-1", ["u-extra"], false);

    expect(updateSubTask).toHaveBeenCalledTimes(2);
    expect(updateSubTask).toHaveBeenCalledWith(
      "st-1",
      "task-1",
      expect.objectContaining({ assignedToIds: ["u-extra"] }),
    );
    expect(updateSubTask).toHaveBeenCalledWith(
      "st-2",
      "task-1",
      expect.objectContaining({ assignedToIds: [] }),
    );
  });

  it("updateBoardSubtaskAssignees keeps extras local on a helper patch", async () => {
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
    await updateBoardSubtaskAssignees("st-2", "task-1", ["u-head", "u-extra"]);

    expect(updateSubTask).toHaveBeenCalledTimes(1);
    expect(updateSubTask).toHaveBeenCalledWith(
      "st-2",
      "task-1",
      expect.objectContaining({ assignedToIds: ["u-head", "u-extra"] }),
    );
  });
});
