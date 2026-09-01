"use server";

import { revalidateTag } from "next/cache";

import {
  createSubTask,
  reorderSubTasks,
  updateSubTask,
} from "@/app/(app)/tasks/[documentId]/actions";
import { auth } from "@/auth";
import type { BoardSubTaskSummary } from "@/components/kanban/types";
import {
  applyChainLinkToggle,
  applyHeadAssigneePropagation,
  applyMaxWorkerSelfAssigneeChange,
  canEditAssignees,
  findChainContaining,
  sameAssigneeIdSet,
  previousChainMember,
  reconcileChainReorder,
  resolveChains,
  sortChainSubTasks,
  type ChainAssigneeState,
  type ChainSubTask,
} from "@/lib/business/subtask-chain";
import type { Role } from "@/lib/auth/nav";
import {
  canManageTasks,
  canMoveBoardTasks,
} from "@/lib/auth/permissions";
import { isAuthenticatedSession } from "@/lib/auth/session";
import {
  buildStepKanbanLookup,
  mapStepsToKanbanSteps,
  resolveStepUuidFromKanbanId,
  stableKanbanTaskNumericId,
} from "@/lib/board/kanban-drizzle-ids";
import { applyAutoStepTaskOrderingAfterTaskChange } from "@/lib/business/apply-step-task-order";
import { loadBoardProgressByTaskId, loadGlobalAssignedCountByColaboratorId } from "@/lib/board/load-board-progress";
import { loadCachedBoardSubtaskCore } from "@/lib/board/load-board-subtask-core";
import {
  liveStateFromOpenActivityRows,
  type BoardSubtaskLiveState,
} from "@/lib/board/board-subtask-live";
import type { BoardSubtaskLinkResult } from "@/lib/business/board-link-queue";
import {
  resolveDrizzleTaskIdByKanbanNumericId,
} from "@/lib/board/load-board-data";
import {
  boardColumnCursorFromTask,
  type BoardColumnPageCursor,
} from "@/lib/board/column-task-page";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import type { BoardTaskRelativeMove } from "@/lib/business/board-task-relative-move";
import {
  applyKanbanTaskReorder,
  collectKanbanTaskUpdates,
  moveTaskToStepInOrder,
  tasksInStep,
  type KanbanTaskOrderItem,
} from "@/lib/business/kanban-task-order";
import type { ActivitySession, KanbanProgressStatus } from "@/lib/business/task-progress";
import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import { parseSubTaskDependencyIds } from "@/lib/business/subtask-dependencies";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import {
  countActiveTasksByStepId,
  getTaskById,
  getSubTaskById,
  listActiveTaskOrderRows,
  listActiveTaskLayoutRows,
  listActiveTasksForBoardColumn,
  listBoardSubtaskAssignees,
  listBoardSubtaskOpenActivities,
  listBoardSubtaskSessionHistory,
  listBoardSubTasksForTask,
  listSubTaskActivitySessions,
  listSubTasksWithRelationsForTask,
  mapBoardSubtaskSessionHistory,
  replaceSubTaskAssignees,
  updateSubTaskLinkedToPrevious,
  updateTaskBoardFields,
} from "@/lib/repos/tasks";
import { releaseFlagsForSubTask } from "@/lib/repos/material-flags";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { KanbanTask } from "@/components/kanban/types";
import { isAutoStepTaskOrder } from "@/lib/schemas/step-task-order-by";
import { STEP_TASKS_PER_LOAD_DEFAULT } from "@/lib/schemas/step";

const FINISHED_STATUS = "finished";

interface SubTaskEntity {
  documentId: string;
  name: string;
  qty: number;
  expectedTime: number;
  sharingType: SubTaskFormInput["sharingType"];
  maxSameTimeWorkers: number;
  status: SubTaskFormInput["status"];
  activationStatus?: SubTaskFormInput["activationStatus"];
  dependencies?: unknown;
  assignedTo?: { documentId: string }[] | null;
}

async function assertCanMove(): Promise<void> {
  const session = await auth();
  if (!canMoveBoardTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanManageBoardSubtasks(): Promise<void> {
  const session = await auth();
  if (!canManageTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateBoardTasks(): void {
  revalidateTag("drizzle:tasks", "default");
  revalidateTag("drizzle:steps", "default");
}

function invalidateBoardSubtaskReads(taskId: string): void {
  revalidateTag("drizzle:subTasks", "default");
  revalidateTag(`board-subtasks:${taskId}`, "default");
}

function mapBoardSubtasksFromCore(
  bundle: Awaited<ReturnType<typeof loadCachedBoardSubtaskCore>>,
): BoardSubTaskSummary[] {
  if (!bundle || bundle.rows.length === 0) return [];

  const { rows, assigneeRows, flagRows = [], dependencyRows = [] } = bundle;
  const assigneesBySubTask = new Map<
    string,
    { documentId: string; name: string }[]
  >();
  for (const row of assigneeRows) {
    const list = assigneesBySubTask.get(row.subTaskId) ?? [];
    list.push({ documentId: row.userId, name: row.name });
    assigneesBySubTask.set(row.subTaskId, list);
  }
  const codesBySubTask = new Map<string, string[]>();
  for (const row of flagRows) {
    const list = codesBySubTask.get(row.subTaskId) ?? [];
    list.push(row.code);
    codesBySubTask.set(row.subTaskId, list);
  }
  const nameById = new Map(rows.map((row) => [row.id, row.name]));
  const producersByConsumer = new Map<string, string[]>();
  for (const row of dependencyRows) {
    const list = producersByConsumer.get(row.consumerId) ?? [];
    list.push(row.producerId);
    producersByConsumer.set(row.consumerId, list);
  }

  return rows.map((subtask) => ({
    documentId: subtask.id,
    name: subtask.name,
    status: subtask.status,
    sharingType: subtask.sharingType === "qty" ? "qty" : "duration",
    qty: Math.max(1, Math.floor(Number(subtask.qty) || 0) || 1),
    index: subtask.index ?? 0,
    expectedTime: subtask.expectedTime ?? 0,
    timeSpent: subtask.timeSpent ?? 0,
    maxSameTimeWorkers: subtask.maxSameTimeWorkers ?? 1,
    linkedToPrevious: subtask.linkedToPrevious ?? false,
    openActivityStartedAts: [],
    producingColaboratorIds: [],
    sessions: [],
    assignedTo: assigneesBySubTask.get(subtask.id) ?? [],
    assignedFlagCodes: codesBySubTask.get(subtask.id) ?? [],
    dependencyFlags: (producersByConsumer.get(subtask.id) ?? [])
      .map((producerId) => ({
        predecessorName: nameById.get(producerId) ?? "",
        codes: codesBySubTask.get(producerId) ?? [],
      }))
      .filter((hint) => hint.codes.length > 0),
  }));
}

export async function pollBoardProgress(
  tasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
): Promise<BoardProgressPollSnapshot> {
  const session = await auth();
  if (!isAuthenticatedSession(session)) {
    throw new Error("unauthorized");
  }

  const loadedDocumentIds = tasks.map((task) => task.documentId);
  const loadedTasks = tasks;

  const [heavy, stepRows, layoutRows, assignedCountByColaboratorId] =
    await Promise.all([
      loadedTasks.length > 0
        ? loadBoardProgressByTaskId(loadedTasks)
        : Promise.resolve({
            progressByTaskId: {},
            badgesByTaskId: {},
            assignedCountByColaboratorId: {},
          }),
      listStepsRepo(),
      listActiveTaskLayoutRows(),
      loadGlobalAssignedCountByColaboratorId(),
    ]);

  const stepLookup = buildStepKanbanLookup(stepRows);
  const layoutByTaskId: BoardProgressPollSnapshot["layoutByTaskId"] = {};
  const totalCountByStepId: Record<string, number> = {};
  const totalsByTaskId: BoardProgressPollSnapshot["totalsByTaskId"] = {};
  const loadedSet = new Set(loadedDocumentIds);

  for (const row of layoutRows) {
    const kanbanStepId = row.stepId
      ? (stepLookup.kanbanIdByStepUuid.get(row.stepId) ?? null)
      : null;
    if (row.stepId) {
      totalCountByStepId[row.stepId] = (totalCountByStepId[row.stepId] ?? 0) + 1;
    }
    layoutByTaskId[row.id] = {
      status: row.status,
      stepId: kanbanStepId,
      index: row.index,
      name: row.name,
      qty: row.qty,
      deliveryDate: row.deliveryDate,
      endedAt: row.endedAt?.toISOString() ?? null,
    };
    if (loadedSet.has(row.id)) {
      totalsByTaskId[row.id] = {
        totalTimeSpent: row.totalTimeSpent ?? 0,
        totalExpectedTime: row.totalExpectedTime ?? 0,
      };
    }
  }

  return {
    progressByTaskId: heavy.progressByTaskId,
    badgesByTaskId: heavy.badgesByTaskId,
    assignedCountByColaboratorId,
    totalsByTaskId,
    layoutByTaskId,
    totalCountByStepId,
    nowMs: Date.now(),
  };
}

export async function loadBoardSubtasks(
  taskDocumentId: string,
): Promise<BoardSubTaskSummary[]> {
  await assertCanManageBoardSubtasks();
  const bundle = await loadCachedBoardSubtaskCore(taskDocumentId);
  return mapBoardSubtasksFromCore(bundle);
}

export async function loadBoardSubtaskLive(
  taskDocumentId: string,
): Promise<Record<string, BoardSubtaskLiveState>> {
  await assertCanManageBoardSubtasks();
  const rows = await listBoardSubTasksForTask(taskDocumentId);
  const openRows = await listBoardSubtaskOpenActivities(
    rows.map((row) => row.id),
  );
  return liveStateFromOpenActivityRows(openRows);
}

export async function loadBoardSubtaskSessions(
  taskDocumentId: string,
): Promise<Record<string, ActivitySession[]>> {
  await assertCanManageBoardSubtasks();
  const rows = await listBoardSubTasksForTask(taskDocumentId);
  const finishedIds = rows
    .filter((row: { status: string }) => row.status === FINISHED_STATUS)
    .map((row: { id: string }) => row.id);
  if (finishedIds.length === 0) return {};
  const historyRows = await listBoardSubtaskSessionHistory(finishedIds);
  return mapBoardSubtaskSessionHistory(historyRows);
}

export async function loadBoardSubtaskSession(
  subTaskDocumentId: string,
): Promise<ActivitySession[]> {
  await assertCanManageBoardSubtasks();
  return listSubTaskActivitySessions(subTaskDocumentId);
}

async function fetchSubTaskForUpdate(
  documentId: string,
): Promise<SubTaskEntity | null> {
  const subtask = await getSubTaskById(documentId);
  if (!subtask) return null;
  const siblings = await listSubTasksWithRelationsForTask(subtask.taskId);
  const row = siblings.find((item) => item.id === documentId);
  if (!row) return null;
  return {
    documentId: row.id,
    name: row.name,
    qty: row.qty,
    expectedTime: row.expectedTime,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    status: row.status,
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
    dependencies: row.dependencyIds,
    assignedTo: row.assignedToIds.map((id) => ({ documentId: id })),
  };
}

function toSubTaskFormInput(
  subtask: SubTaskEntity,
  assignedToIds: string[],
): SubTaskFormInput {
  return {
    name: subtask.name,
    qty: subtask.qty,
    expectedTime: subtask.expectedTime,
    sharingType: subtask.sharingType ?? "duration",
    maxSameTimeWorkers: subtask.maxSameTimeWorkers ?? 1,
    status: subtask.status,
    activationStatus: subtask.activationStatus ?? "locked",
    dependencyIds: parseSubTaskDependencyIds(subtask.dependencies),
    assignedToIds,
  };
}

export async function createBoardSubtask(
  taskDocumentId: string,
  values: SubTaskFormInput,
): Promise<void> {
  await assertCanManageBoardSubtasks();
  await createSubTask(taskDocumentId, values);
  invalidateBoardSubtaskReads(taskDocumentId);
}

function toAssigneeState(row: ChainSubTask): ChainAssigneeState {
  return {
    documentId: row.documentId,
    linkedToPrevious: row.linkedToPrevious,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    assignedToIds: row.assignedToIds,
  };
}

function assigneeIdsEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

async function persistChainAssigneeStates(
  before: readonly ChainAssigneeState[],
  after: readonly ChainAssigneeState[],
): Promise<void> {
  const beforeById = new Map(before.map((row) => [row.documentId, row]));
  for (const row of after) {
    const previous = beforeById.get(row.documentId);
    if (!previous) continue;
    if (previous.linkedToPrevious !== row.linkedToPrevious) {
      await updateSubTaskLinkedToPrevious(row.documentId, row.linkedToPrevious);
    }
    if (!assigneeIdsEqual(previous.assignedToIds, row.assignedToIds)) {
      await replaceSubTaskAssignees(row.documentId, row.assignedToIds);
    }
  }
}

export async function reorderBoardSubtasks(
  taskDocumentId: string,
  orderedDocumentIds: string[],
  movedDocumentId: string,
): Promise<void> {
  await assertCanManageBoardSubtasks();
  const siblings = await listSubTasksWithRelationsForTask(taskDocumentId);
  const ordered = sortChainSubTasks(siblings.map(toChainSubTask));
  const pending = ordered.filter((row) => row.status !== FINISHED_STATUS);
  const pendingIds = new Set(pending.map((row) => row.documentId));
  const before = pending.map(toAssigneeState);
  const pendingOrder = orderedDocumentIds.filter((id) => pendingIds.has(id));
  const after = reconcileChainReorder(before, pendingOrder, movedDocumentId);
  await persistChainAssigneeStates(before, after);
  await reorderSubTasks(taskDocumentId, orderedDocumentIds);
  invalidateBoardSubtaskReads(taskDocumentId);
}

function toChainSubTask(row: {
  id: string;
  index: number;
  status: string;
  activationStatus?: string | null;
  linkedToPrevious: boolean;
  maxSameTimeWorkers: number;
  assignedToIds: string[];
  dependencyIds: string[];
}): ChainSubTask {
  return {
    documentId: row.id,
    index: row.index,
    status: row.status,
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
    linkedToPrevious: row.linkedToPrevious,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    assignedToIds: row.assignedToIds,
    dependencyIds: row.dependencyIds,
  };
}

export async function updateBoardSubtaskLink(
  taskDocumentId: string,
  subtaskDocumentId: string,
  linkedToPrevious: boolean,
): Promise<BoardSubtaskLinkResult> {
  await assertCanManageBoardSubtasks();
  const siblings = await listSubTasksWithRelationsForTask(taskDocumentId);
  const pending = sortChainSubTasks(siblings.map(toChainSubTask)).filter(
    (row) => row.status !== FINISHED_STATUS,
  );
  const current = pending.find((item) => item.documentId === subtaskDocumentId);
  if (!current) throw new Error("notFound");
  if (
    linkedToPrevious &&
    previousChainMember(pending, subtaskDocumentId) == null
  ) {
    throw new Error("invalid_link");
  }

  const before = pending.map(toAssigneeState);
  const after = applyChainLinkToggle(before, subtaskDocumentId, linkedToPrevious);
  await persistChainAssigneeStates(before, after);

  const updatedState = after.find(
    (row) => row.documentId === subtaskDocumentId,
  );
  if (!updatedState) throw new Error("notFound");

  const assigneeRows = await listBoardSubtaskAssignees([subtaskDocumentId]);
  invalidateBoardSubtaskReads(taskDocumentId);
  return {
    documentId: subtaskDocumentId,
    linkedToPrevious: updatedState.linkedToPrevious,
    assignedTo: assigneeRows.map((row) => ({
      documentId: row.userId,
      name: row.name,
    })),
  };
}

export async function updateBoardSubtaskAssignees(
  subtaskDocumentId: string,
  taskDocumentId: string,
  assignedToIds: string[],
  propagateChain = true,
): Promise<void> {
  await assertCanManageBoardSubtasks();
  const siblings = await listSubTasksWithRelationsForTask(taskDocumentId);
  const chainItems = siblings.map(toChainSubTask);
  const chains = resolveChains(chainItems);
  const chain = findChainContaining(chains, subtaskDocumentId);
  const current = chainItems.find((item) => item.documentId === subtaskDocumentId);
  if (!current) throw new Error("notFound");

  if (!chain || chain.memberIds.length <= 1) {
    const subtask = await fetchSubTaskForUpdate(subtaskDocumentId);
    if (!subtask) throw new Error("notFound");
    await updateSubTask(
      subtaskDocumentId,
      taskDocumentId,
      toSubTaskFormInput(subtask, assignedToIds),
    );
    invalidateBoardSubtaskReads(taskDocumentId);
    return;
  }

  const role = canEditAssignees(
    current.documentId,
    current.maxSameTimeWorkers,
    chain,
  );
  if (role === "none") throw new Error("forbidden");

  const members = chain.memberIds
    .map((id) => chainItems.find((item) => item.documentId === id))
    .filter((item): item is ChainSubTask => Boolean(item));

  if (role === "helper" || !propagateChain) {
    const nextRows = applyMaxWorkerSelfAssigneeChange(
      members,
      subtaskDocumentId,
      assignedToIds,
    );
    for (const update of nextRows) {
      const previous = members.find(
        (item) => item.documentId === update.documentId,
      );
      if (
        previous &&
        sameAssigneeIdSet(previous.assignedToIds, update.assignedToIds)
      ) {
        continue;
      }
      const subtask = await fetchSubTaskForUpdate(update.documentId);
      if (!subtask) continue;
      await updateSubTask(
        update.documentId,
        taskDocumentId,
        toSubTaskFormInput(subtask, update.assignedToIds),
      );
    }
    invalidateBoardSubtaskReads(taskDocumentId);
    return;
  }

  const propagated = applyHeadAssigneePropagation(
    members,
    chain.headId,
    assignedToIds,
  );
  for (const update of propagated) {
    const subtask = await fetchSubTaskForUpdate(update.documentId);
    if (!subtask) continue;
    await updateSubTask(
      update.documentId,
      taskDocumentId,
      toSubTaskFormInput(subtask, update.assignedToIds),
    );
  }
  invalidateBoardSubtaskReads(taskDocumentId);
}

export async function applyBoardTaskOrder(
  updates: { documentId: string; index: number; stepId: number | null }[],
): Promise<void> {
  if (updates.length === 0) return;
  await assertCanMove();

  const stepLookup = buildStepKanbanLookup(await listStepsRepo());
  const beforeByDocumentId = new Map<
    string,
    { stepId: string | null; deliveryDate: string | null }
  >();

  for (const update of updates) {
    const task = await getTaskById(update.documentId);
    if (task) {
      beforeByDocumentId.set(update.documentId, {
        stepId: task.stepId,
        deliveryDate: task.deliveryDate,
      });
    }
  }

  for (const update of updates) {
    let stepUuid: string | null | undefined;
    if (update.stepId != null) {
      stepUuid = resolveStepUuidFromKanbanId(stepLookup, update.stepId);
      if (!stepUuid) {
        throw new Error("notFound");
      }
    }
    await updateTaskBoardFields(update.documentId, {
      index: update.index,
      stepId: update.stepId != null ? stepUuid : undefined,
    });
  }

  for (const update of updates) {
    const before = beforeByDocumentId.get(update.documentId);
    if (!before) continue;
    const afterTask = await getTaskById(update.documentId);
    if (!afterTask) continue;
    await applyAutoStepTaskOrderingAfterTaskChange({
      before,
      after: {
        stepId: afterTask.stepId,
        deliveryDate: afterTask.deliveryDate,
      },
    });
  }

  invalidateBoardTasks();
}

function resolveOverTaskIdForPlacement(
  orderItems: KanbanTaskOrderItem[],
  targetStepKanbanId: number,
  placement: BoardTaskRelativeMove["placement"],
): number | null {
  if (placement.kind === "end") return null;
  const anchor = orderItems.find(
    (task) => task.documentId === placement.anchorDocumentId,
  );
  if (!anchor) return null;
  if (placement.kind === "before") return anchor.id;

  const inStep = tasksInStep(orderItems, targetStepKanbanId);
  const anchorIndex = inStep.findIndex((task) => task.id === anchor.id);
  if (anchorIndex < 0) return null;
  return inStep[anchorIndex + 1]?.id ?? null;
}

export async function applyBoardTaskRelativeMove(
  move: BoardTaskRelativeMove,
): Promise<void> {
  await assertCanMove();

  const stepRows = await listStepsRepo();
  const stepLookup = buildStepKanbanLookup(stepRows);
  const targetStepUuid = resolveStepUuidFromKanbanId(
    stepLookup,
    move.targetStepKanbanId,
  );
  if (!targetStepUuid) throw new Error("notFound");

  const targetStep = stepRows.find((step) => step.id === targetStepUuid);
  const before = await getTaskById(move.taskDocumentId);
  if (!before) throw new Error("notFound");

  if (targetStep && isAutoStepTaskOrder(targetStep.taskOrderBy)) {
    if (before.stepId !== targetStepUuid) {
      await updateTaskBoardFields(move.taskDocumentId, {
        index: before.index,
        stepId: targetStepUuid,
      });
      await applyAutoStepTaskOrderingAfterTaskChange({
        before: {
          stepId: before.stepId,
          deliveryDate: before.deliveryDate,
        },
        after: {
          stepId: targetStepUuid,
          deliveryDate: before.deliveryDate,
        },
      });
    }
    invalidateBoardTasks();
    return;
  }

  const orderRows = await listActiveTaskOrderRows();
  const steps = sortStepsForLookup(stepRows);
  const orderItems: KanbanTaskOrderItem[] = orderRows.map((row) => ({
    id: stableKanbanTaskNumericId(row.id),
    documentId: row.id,
    stepId: row.stepId
      ? (stepLookup.kanbanIdByStepUuid.get(row.stepId) ?? null)
      : null,
    index: row.index,
  }));

  const active = orderItems.find(
    (task) => task.documentId === move.taskDocumentId,
  );
  if (!active) throw new Error("notFound");

  const overTaskId = resolveOverTaskIdForPlacement(
    orderItems,
    move.targetStepKanbanId,
    move.placement,
  );

  let next: KanbanTaskOrderItem[];
  if (
    active.stepId === move.targetStepKanbanId &&
    overTaskId != null &&
    move.placement.kind !== "end"
  ) {
    const reordered = applyKanbanTaskReorder(
      orderItems,
      steps,
      active.id,
      overTaskId,
    );
    if (!reordered) {
      invalidateBoardTasks();
      return;
    }
    next = reordered;
  } else {
    next = moveTaskToStepInOrder(
      orderItems,
      steps,
      active.id,
      move.targetStepKanbanId,
      overTaskId,
    );
  }

  const updates = collectKanbanTaskUpdates(orderItems, next);
  for (const update of updates) {
    let stepUuid: string | null | undefined;
    if (update.stepId != null) {
      stepUuid = resolveStepUuidFromKanbanId(stepLookup, update.stepId);
      if (!stepUuid) throw new Error("notFound");
    }
    await updateTaskBoardFields(update.documentId, {
      index: update.index,
      stepId: update.stepId != null ? stepUuid : undefined,
    });
  }

  const afterTask = await getTaskById(move.taskDocumentId);
  if (afterTask) {
    await applyAutoStepTaskOrderingAfterTaskChange({
      before: {
        stepId: before.stepId,
        deliveryDate: before.deliveryDate,
      },
      after: {
        stepId: afterTask.stepId,
        deliveryDate: afterTask.deliveryDate,
      },
    });
  }

  invalidateBoardTasks();
}

function sortStepsForLookup(
  stepRows: Awaited<ReturnType<typeof listStepsRepo>>,
): { id: number }[] {
  return mapStepsToKanbanSteps(stepRows).map((step) => ({ id: step.id }));
}

export async function loadFirstBoardColumnPage(
  stepDocumentId: string,
): Promise<{
  stepDocumentId: string;
  totalCount: number;
  tasks: KanbanTask[];
  cursor: BoardColumnPageCursor | null;
}> {
  const result = await loadMoreBoardColumnTasks({
    stepDocumentId,
    cursor: null,
    limit: 0,
  });
  return {
    stepDocumentId,
    totalCount: result.totalCount,
    tasks: result.tasks,
    cursor: result.cursor,
  };
}

export async function loadMoreBoardColumnTasks(input: {
  stepDocumentId: string;
  cursor: BoardColumnPageCursor | null;
  limit: number;
}): Promise<{
  tasks: KanbanTask[];
  cursor: BoardColumnPageCursor | null;
  totalCount: number;
}> {
  const session = await auth();
  if (!isAuthenticatedSession(session)) {
    throw new Error("unauthorized");
  }

  const stepRows = await listStepsRepo();
  const step = stepRows.find((row) => row.id === input.stepDocumentId);
  if (!step) throw new Error("notFound");

  const limit = Math.max(
    1,
    Math.min(
      input.limit || step.tasksPerLoad || STEP_TASKS_PER_LOAD_DEFAULT,
      50,
    ),
  );
  const stepLookup = buildStepKanbanLookup(stepRows);
  const [totalCount, taskRows] = await Promise.all([
    countActiveTasksByStepId(step.id),
    listActiveTasksForBoardColumn(step.id, step.taskOrderBy, {
      limit,
      cursor: input.cursor,
    }),
  ]);

  const mapped: KanbanTask[] = taskRows.map((task) => ({
    id: stableKanbanTaskNumericId(task.id),
    documentId: task.id,
    name: task.name,
    qty: task.qty,
    status: task.status,
    stepId: task.stepId
      ? (stepLookup.kanbanIdByStepUuid.get(task.stepId) ?? null)
      : null,
    index: task.index,
    deliveryDate: task.deliveryDate,
    endedAt: task.endedAt?.toISOString() ?? null,
    totalExpectedTime: task.totalExpectedTime,
    totalTimeSpent: task.totalTimeSpent,
  }));

  const { progressByTaskId, badgesByTaskId } = await loadBoardProgressByTaskId(
    mapped.map((task) => ({
      documentId: task.documentId,
      status: task.status,
    })),
  );
  const nowMs = Date.now();
  const tasks = mapped.map((task) => {
    const badges = badgesByTaskId[task.documentId];
    return {
      ...task,
      activeColaboratorCount: badges?.activeColaboratorCount ?? 0,
      unassignedSubTaskCount: badges?.unassignedSubTaskCount ?? 0,
      participantCount: badges?.participantCount ?? 0,
      progressPending: false,
      progressInput: progressByTaskId[task.documentId] ?? {
        subTasks: [],
        openActivityStartedAts: [],
      },
      progressNowMs: nowMs,
    };
  });

  const last = taskRows[taskRows.length - 1];
  return {
    tasks,
    totalCount,
    cursor: last ? boardColumnCursorFromTask(last) : input.cursor,
  };
}

export async function syncBoardSteps(): Promise<{
  steps: ReturnType<typeof mapStepsToKanbanSteps>;
}> {
  const session = await auth();
  if (!isAuthenticatedSession(session)) {
    throw new Error("unauthorized");
  }
  const stepRows = await listStepsRepo();
  return { steps: mapStepsToKanbanSteps(stepRows) };
}

export async function moveTaskToStep(
  taskId: number,
  stepId: number,
): Promise<void> {
  await assertCanMove();

  const [taskDocumentId, stepLookup] = await Promise.all([
    resolveDrizzleTaskIdByKanbanNumericId(taskId),
    listStepsRepo().then((steps) => buildStepKanbanLookup(steps)),
  ]);
  const stepDocumentId = resolveStepUuidFromKanbanId(stepLookup, stepId);
  if (!taskDocumentId || !stepDocumentId) {
    throw new Error("notFound");
  }
  const before = await getTaskById(taskDocumentId);
  await updateTaskBoardFields(taskDocumentId, {
    index: before?.index ?? 0,
    stepId: stepDocumentId,
  });
  if (before) {
    await applyAutoStepTaskOrderingAfterTaskChange({
      before: {
        stepId: before.stepId,
        deliveryDate: before.deliveryDate,
      },
      after: {
        stepId: stepDocumentId,
        deliveryDate: before.deliveryDate,
      },
    });
  }
  invalidateBoardTasks();
}

export async function releaseBoardSubTaskFlags(
  subTaskDocumentId: string,
): Promise<void> {
  await assertCanManageBoardSubtasks();
  const subtask = await getSubTaskById(subTaskDocumentId);
  if (!subtask) throw new Error("notFound");
  await releaseFlagsForSubTask(subTaskDocumentId);
  await runTaskSubTaskSyncRoutine(subtask.taskId);
  invalidateBoardSubtaskReads(subtask.taskId);
}
