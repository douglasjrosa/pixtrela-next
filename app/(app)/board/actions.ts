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
  appendSubtaskToTemplateComponents,
  mapDependencyIdsToTemplateIndexes,
} from "@/lib/business/append-subtask-to-template";
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
  canManageTemplates,
  canMoveBoardTasks,
} from "@/lib/auth/permissions";
import { isAuthenticatedSession } from "@/lib/auth/session";
import {
  buildStepKanbanLookup,
  resolveStepUuidFromKanbanId,
} from "@/lib/board/kanban-drizzle-ids";
import {
  applyAutoStepTaskOrderingAfterTaskChange,
} from "@/lib/business/apply-step-task-order";
import { loadBoardProgressByTaskId } from "@/lib/board/load-board-progress";
import type { BoardSubtaskLinkResult } from "@/lib/business/board-link-queue";
import {
  resolveDrizzleTaskIdByKanbanNumericId,
} from "@/lib/board/load-board-data";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import {
  listActivitySessions,
  listOpenActivityStartedAts,
  listOpenColaboratorDocumentIds,
  type ActivitySessionRef,
  type KanbanProgressStatus,
} from "@/lib/business/task-progress";
import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import { parseSubTaskDependencyIds } from "@/lib/business/subtask-dependencies";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import {
  findTemplateByCode,
  listTemplateSubTasks,
  updateTemplateTask,
} from "@/lib/repos/templates";
import {
  getTaskById,
  getSubTaskById,
  listBoardSubtaskRows,
  listSubTasksForTask,
  listSubTasksWithRelationsForTask,
  replaceSubTaskAssignees,
  updateSubTaskLinkedToPrevious,
  updateTaskBoardFields,
} from "@/lib/repos/tasks";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";

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
  reasonForDisabling?: string | null;
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

function dependencyIndexesFrom(
  dependencies: TemplateSubTaskComponentInput["dependencies"],
): number[] {
  if (!Array.isArray(dependencies)) return [];
  return dependencies.filter((value): value is number => typeof value === "number");
}

function mapBoardSubtasksFromDrizzle(
  bundle: Awaited<ReturnType<typeof listBoardSubtaskRows>>,
): BoardSubTaskSummary[] {
  if (!bundle || bundle.rows.length === 0) return [];

  const { rows, assigneeRows, activityRows } = bundle;
  const assigneesBySubTask = new Map<string, { documentId: string; name: string }[]>();
  for (const row of assigneeRows) {
    const list = assigneesBySubTask.get(row.subTaskId) ?? [];
    list.push({ documentId: row.userId, name: row.name });
    assigneesBySubTask.set(row.subTaskId, list);
  }

  const activitiesBySubTask = new Map<string, ActivitySessionRef[]>();
  for (const activity of activityRows) {
    const list = activitiesBySubTask.get(activity.subTaskId) ?? [];
    list.push({
      subTaskDocumentId: activity.subTaskId,
      colaboratorDocumentId: activity.colaboratorId,
      colaboratorName: activity.colaboratorName,
      action: activity.action,
      timestamp: activity.timestamp.toISOString(),
      qty: activity.qty,
    });
    activitiesBySubTask.set(activity.subTaskId, list);
  }

  return rows.map((subtask) => {
    const activityRefs = activitiesBySubTask.get(subtask.id) ?? [];
    return {
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
      openActivityStartedAts: listOpenActivityStartedAts(activityRefs),
      producingColaboratorIds: listOpenColaboratorDocumentIds(activityRefs),
      sessions: listActivitySessions(activityRefs),
      assignedTo: assigneesBySubTask.get(subtask.id) ?? [],
    };
  });
}

export async function pollBoardProgress(
  tasks: ReadonlyArray<{ documentId: string; status: KanbanProgressStatus }>,
): Promise<BoardProgressPollSnapshot> {
  const session = await auth();
  if (!isAuthenticatedSession(session)) {
    throw new Error("unauthorized");
  }

  const { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId } =
    await loadBoardProgressByTaskId(tasks);

  const documentIds = tasks.map((task) => task.documentId);
  const totalsByTaskId: BoardProgressPollSnapshot["totalsByTaskId"] = {};
  const layoutByTaskId: BoardProgressPollSnapshot["layoutByTaskId"] = {};

  if (documentIds.length > 0) {
    const stepLookup = buildStepKanbanLookup(await listStepsRepo());
    for (const taskId of documentIds) {
      const task = await getTaskById(taskId);
      if (!task) continue;
      totalsByTaskId[taskId] = {
        totalTimeSpent: task.totalTimeSpent ?? 0,
        totalExpectedTime: task.totalExpectedTime ?? 0,
      };
      layoutByTaskId[taskId] = {
        status: task.status,
        stepId: task.stepId
          ? (stepLookup.kanbanIdByStepUuid.get(task.stepId) ?? null)
          : null,
        index: task.index,
        name: task.name,
        qty: task.qty,
        deliveryDate: task.deliveryDate,
        endedAt: task.endedAt?.toISOString() ?? null,
      };
    }
  }

  return {
    progressByTaskId,
    badgesByTaskId,
    assignedCountByColaboratorId,
    totalsByTaskId,
    layoutByTaskId,
    nowMs: Date.now(),
  };
}

export async function loadBoardSubtasks(
  taskDocumentId: string,
): Promise<BoardSubTaskSummary[]> {
  await assertCanManageBoardSubtasks();
  const bundle = await listBoardSubtaskRows(taskDocumentId);
  return mapBoardSubtasksFromDrizzle(bundle);
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
    reasonForDisabling: row.reasonForDeactivation,
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
    reasonForDisabling: subtask.reasonForDisabling ?? "",
    dependencyIds: parseSubTaskDependencyIds(subtask.dependencies),
    assignedToIds,
  };
}

export async function createBoardSubtask(
  taskDocumentId: string,
  values: SubTaskFormInput,
  options?: { addToTemplate?: boolean },
): Promise<void> {
  await assertCanManageBoardSubtasks();
  await createSubTask(taskDocumentId, values);
  if (options?.addToTemplate) {
    await appendBoardSubtaskToTaskTemplate(taskDocumentId, values);
  }
}

async function fetchTaskTemplateCode(
  taskDocumentId: string,
): Promise<string | null> {
  const task = await getTaskById(taskDocumentId);
  const code = task?.templateTaskCode?.trim();
  return code ? code : null;
}

async function fetchTemplateByCode(code: string): Promise<{
  documentId: string;
  name: string;
  code: string;
  subTask: TemplateSubTaskComponentInput[];
} | null> {
  const template = await findTemplateByCode(code);
  if (!template) return null;
  const subTaskRows = await listTemplateSubTasks(template.id);
  return {
    documentId: template.id,
    name: template.name,
    code: template.code,
    subTask: subTaskRows.map((row) => ({
      name: row.name,
      qty: row.qty,
      index: row.index,
      expectedTime: row.expectedTime,
      sharingType: row.sharingType,
      maxSameTimeWorkers: row.maxSameTimeWorkers,
      dependencyIndexes: row.dependencyIndexes ?? [],
      linkedToPrevious: row.linkedToPrevious,
    })),
  };
}

async function fetchTaskSubtaskRefs(
  taskDocumentId: string,
): Promise<{ documentId: string; name: string }[]> {
  const rows = await listSubTasksForTask(taskDocumentId);
  return rows.map((row) => ({ documentId: row.id, name: row.name }));
}

async function appendBoardSubtaskToTaskTemplate(
  taskDocumentId: string,
  values: SubTaskFormInput,
): Promise<void> {
  const session = await auth();
  if (!canManageTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }

  const templateCode = await fetchTaskTemplateCode(taskDocumentId);
  if (!templateCode) {
    throw new Error("no_template");
  }

  const template = await fetchTemplateByCode(templateCode);
  if (!template) {
    throw new Error("template_not_found");
  }

  const taskSubtasks = await fetchTaskSubtaskRefs(taskDocumentId);
  const dependencyIndexes = mapDependencyIdsToTemplateIndexes(
    values.dependencyIds ?? [],
    taskSubtasks,
    template.subTask.map((row) => row.name),
  );
  const nextSubTasks = appendSubtaskToTemplateComponents(
    template.subTask,
    values,
    dependencyIndexes,
  );

  await updateTemplateTask({
    id: template.documentId,
    name: template.name,
    code: template.code,
    subTasks: nextSubTasks.map((row) => ({
      name: row.name,
      qty: row.qty,
      index: row.index,
      expectedTime: row.expectedTime,
      sharingType: row.sharingType,
      maxSameTimeWorkers: row.maxSameTimeWorkers,
      dependencyIndexes: dependencyIndexesFrom(row.dependencies),
      linkedToPrevious: row.linkedToPrevious ?? false,
    })),
  });
  revalidateTag("drizzle:templates", "default");
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

  const mapped = mapBoardSubtasksFromDrizzle(
    await listBoardSubtaskRows(taskDocumentId),
  );
  const updated = mapped.find((item) => item.documentId === subtaskDocumentId);
  if (!updated) throw new Error("notFound");
  return {
    documentId: updated.documentId,
    linkedToPrevious: updated.linkedToPrevious,
    assignedTo: updated.assignedTo,
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
