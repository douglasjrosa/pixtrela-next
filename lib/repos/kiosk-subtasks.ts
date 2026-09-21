import { and, asc, desc, eq, inArray } from "drizzle-orm";

import {
  activities,
  currencies,
  currencyForSubtasks,
  flags,
  subTaskAssignees,
  subTaskDependencies,
  subTasks,
  tasks,
  users,
} from "@/drizzle/schema";
import {
  findSubTaskIdsNeedingProducingReconcile,
  selectRowsForProducingReconcile,
  selectRowsForQtyCompleteReconcile,
} from "@/lib/business/subtask-producing-reconcile";
import { calculateActivityDurationSeconds } from "@/lib/business/activity-duration";
import {
  collectKioskQueueCatalogScope,
  filterCatalogByScope,
} from "@/lib/business/kiosk-queue-catalog-scope";
import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import {
  buildKioskQueueUnits,
  paginateQueueUnits,
  splitQueueUnitsByKioskSection,
  type KioskQueueSectionKey,
  type KioskQueueUnit,
} from "@/lib/business/kiosk-queue-units";
import { resolveChains } from "@/lib/business/subtask-chain";
import { listSubTasksWithRelationsForTasks } from "@/lib/repos/tasks";
import {
  filterKioskDailyQueue,
  sortKioskDailyQueue,
} from "@/lib/business/kiosk-daily-queue";
import {
  buildFinishedAtBySubTaskId,
  buildOpenStartedAtBySubTaskId,
  buildViewerStopStatsBySubTaskId,
  filterKioskVisibleSubTasks,
  mapSubTaskDbRow,
  sumStoppedQtyBySubTaskId,
  type SessionActivityRef,
  type SubTaskDbRow,
} from "@/lib/business/kiosk-subtask-map";
import {
  canAuthorizeKioskStop,
  isQtyTargetFullyMet,
  parseDurationStopBody,
  parseQtyStopBody,
  resolveDurationStop,
  resolveKioskStopNextStatus,
  resolveQtyStop,
  shouldFinalizeSubTaskOnStop,
  type KioskStopBody,
} from "@/lib/business/kiosk-stop";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import {
  hasOpenStartedSessionFromActions,
  isSubTaskAtWorkerCapacity,
  listActiveColaboratorIdsFromActivities,
  shouldHideSubTaskFromKioskQueue,
} from "@/lib/business/subtask-active-workers";
import type { ActivityTimeRow } from "@/lib/business/task-time-spent";
import {
  calculateDurationCurrencyCredits,
  calculateQtySessionCurrency,
  resolveSubTaskTargetQty,
  shouldCreditDurationCurrency,
} from "@/lib/domain/work-currency";
import { listTimeSpentByColaborator } from "@/lib/business/task-time-spent";
import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import { getDb, type Db } from "@/lib/db/client";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import {
  creditBalanceIncome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import {
  fetchUserNamesByIds,
  runTaskSubTaskSyncRoutine,
} from "@/lib/repos/subtask-lifecycle";
import {
  assignFlagsToSubTask,
  listAssignedFlagsForSubTasks,
  listAvailableFlagsForCategory,
  listFlagIdsForSubTask,
  releaseProducerFlagsWhenConsumersFinished,
  resolveKioskMaterialFlagOptions,
  subTaskHasDependents,
} from "@/lib/repos/material-flags";
import { getKioskSettings } from "@/lib/repos/settings";
import {
  DEFAULT_KIOSK_QUEUE_PAGE_SIZE,
  normalizeKioskQueuePageSize,
} from "@/lib/schemas/kiosk-setting";
import { formatMaterialFlagCode } from "@/lib/business/material-flag-code";
import { buildDependencyFlagHintsForItem } from "@/lib/business/kiosk-dependency-flags";
import {
  assertFinishFlagsAllowed,
  mergeFlagIds,
  resolveCategoryIdFromFlagCategories,
} from "@/lib/business/subtask-material-flags";
import {
  attachHelperStartToOpenRun,
  findLatestChainRunIdForSubTask,
  findOpenChainRunForSubTask,
  findOpenChainRunsForMemberGroups,
  reallocateChainRunAfterHelperStop,
} from "@/lib/repos/kiosk-chains";

const PRODUCING_STATUS = "producing";
const UNLOCKED_ACTIVATION = "unlocked";

async function assertSubTaskAssigned(
  colaboratorId: string,
  subTaskId: string,
  db: Db,
): Promise<void> {
  const [row] = await db
    .select({ subTaskId: subTaskAssignees.subTaskId })
    .from(subTaskAssignees)
    .where(
      and(
        eq(subTaskAssignees.userId, colaboratorId),
        eq(subTaskAssignees.subTaskId, subTaskId),
      ),
    )
    .limit(1);
  if (!row) throw new Error("forbidden");
}

async function resolvePaymentCurrency(db: Db) {
  const [setting] = await db.select().from(currencyForSubtasks).limit(1);
  if (!setting) return null;
  const [currency] = await db
    .select()
    .from(currencies)
    .where(eq(currencies.id, setting.currencyId))
    .limit(1);
  return currency ?? null;
}

function toSubTaskDbRow(
  row: {
    id: string;
    name: string;
    index: number;
    status: string;
    activationStatus: string;
    qty: number;
    sharingType: string;
    timeSpent: number;
    expectedTime: number;
    maxSameTimeWorkers: number;
    linkedToPrevious?: boolean;
    taskId: string;
    taskName: string;
    taskIndex: number;
    taskQty: number;
  },
): SubTaskDbRow {
  return {
    id: row.id,
    name: row.name,
    index: row.index,
    status: row.status,
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
    qty: row.qty,
    sharingType: row.sharingType,
    timeSpent: row.timeSpent,
    expectedTime: row.expectedTime,
    taskId: row.taskId,
    taskName: row.taskName,
    taskIndex: row.taskIndex,
    taskQty: row.taskQty,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    linkedToPrevious: row.linkedToPrevious === true,
  };
}

async function attachKioskListingFlagFields(
  items: KioskSubTask[],
  db: Db,
): Promise<KioskSubTask[]> {
  if (items.length === 0) return items;
  const ids = items.map((item) => item.documentId);
  const dependencyIds = [
    ...new Set(items.flatMap((item) => item.dependencyIds ?? [])),
  ];
  const flagLookupIds = [...new Set([...ids, ...dependencyIds])];
  const assignedRows = await listAssignedFlagsForSubTasks(flagLookupIds, db);
  const codesBySubTask = new Map<string, string[]>();
  const flagsBySubTask = new Map<
    string,
    Array<{ id: string; code: string }>
  >();
  for (const row of assignedRows) {
    const code = formatMaterialFlagCode(row.categoryRef, row.index);
    const codes = codesBySubTask.get(row.subTaskId) ?? [];
    codes.push(code);
    codesBySubTask.set(row.subTaskId, codes);
    const flags = flagsBySubTask.get(row.subTaskId) ?? [];
    flags.push({ id: row.flagId, code });
    flagsBySubTask.set(row.subTaskId, flags);
  }

  const byId = new Map(items.map((item) => [item.documentId, item]));
  const missingDependencyIds = dependencyIds.filter((depId) => !byId.has(depId));
  const predecessorsById = new Map(
    items.map((item) => [
      item.documentId,
      {
        name: item.name,
        status: item.status,
        subTaskCategoryId: item.subTaskCategoryId,
      },
    ]),
  );
  if (missingDependencyIds.length > 0) {
    const rows = await db
      .select({
        id: subTasks.id,
        name: subTasks.name,
        status: subTasks.status,
        subTaskCategoryId: subTasks.subTaskCategoryId,
      })
      .from(subTasks)
      .where(inArray(subTasks.id, missingDependencyIds));
    for (const row of rows) {
      predecessorsById.set(row.id, {
        name: row.name,
        status: row.status,
        subTaskCategoryId: row.subTaskCategoryId,
      });
    }
  }

  return items.map((item) => {
    const dependencyFlags = buildDependencyFlagHintsForItem(
      item.dependencyIds ?? [],
      predecessorsById,
      codesBySubTask,
      flagsBySubTask,
    );

    return {
      ...item,
      assignedFlagCodes: codesBySubTask.get(item.documentId) ?? [],
      dependencyFlags,
      availableFlags: undefined,
      requiresMaterialFlagsOnFinish: undefined,
    };
  });
}

/** Full flag options for producing / exit (N+1 acceptable for few cards). */
async function attachKioskProducingFlagFields(
  items: KioskSubTask[],
  db: Db,
): Promise<KioskSubTask[]> {
  if (items.length === 0) return items;
  const withListing = await attachKioskListingFlagFields(items, db);
  return Promise.all(
    withListing.map(async (item) => {
      const flagOptions = await resolveKioskMaterialFlagOptions(
        item.documentId,
        item.subTaskCategoryId,
        db,
      );
      return {
        ...item,
        subTaskCategoryId: flagOptions.categoryId,
        availableFlags: flagOptions.flags,
        requiresMaterialFlagsOnFinish: flagOptions.requiresMaterialFlagsOnFinish,
      };
    }),
  );
}

async function attachKioskFlagFields(
  items: KioskSubTask[],
  db: Db,
): Promise<KioskSubTask[]> {
  return attachKioskListingFlagFields(items, db);
}

async function fetchAssignedSubTaskRows(
  colaboratorId: string,
  db: Db,
) {
  return db
    .select({
      id: subTasks.id,
      name: subTasks.name,
      index: subTasks.index,
      status: subTasks.status,
      activationStatus: subTasks.activationStatus,
      qty: subTasks.qty,
      sharingType: subTasks.sharingType,
      timeSpent: subTasks.timeSpent,
      expectedTime: subTasks.expectedTime,
      maxSameTimeWorkers: subTasks.maxSameTimeWorkers,
      linkedToPrevious: subTasks.linkedToPrevious,
      subTaskCategoryId: subTasks.subTaskCategoryId,
      taskId: tasks.id,
      taskName: tasks.name,
      taskIndex: tasks.index,
      taskQty: tasks.qty,
    })
    .from(subTasks)
    .innerJoin(subTaskAssignees, eq(subTaskAssignees.subTaskId, subTasks.id))
    .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
    .where(eq(subTaskAssignees.userId, colaboratorId))
    .orderBy(asc(subTasks.index));
}

async function fetchOpenStartedSubTaskIdsForColaborator(
  colaboratorId: string,
  db: Db,
): Promise<string[]> {
  const rows = await db
    .select({
      subTaskId: activities.subTaskId,
      action: activities.action,
      timestamp: activities.timestamp,
    })
    .from(activities)
    .where(
      and(
        eq(activities.colaboratorId, colaboratorId),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));

  const bySubTask = new Map<string, Array<"started" | "stoped">>();
  for (const row of rows) {
    const list = bySubTask.get(row.subTaskId) ?? [];
    list.push(row.action);
    bySubTask.set(row.subTaskId, list);
  }

  const openIds: string[] = [];
  for (const [subTaskId, actions] of bySubTask) {
    if (hasOpenStartedSessionFromActions(actions)) {
      openIds.push(subTaskId);
    }
  }
  return openIds;
}

async function fetchSubTaskRowsByIds(subTaskIds: string[], db: Db) {
  if (subTaskIds.length === 0) return [];
  return db
    .select({
      id: subTasks.id,
      name: subTasks.name,
      index: subTasks.index,
      status: subTasks.status,
      activationStatus: subTasks.activationStatus,
      qty: subTasks.qty,
      sharingType: subTasks.sharingType,
      timeSpent: subTasks.timeSpent,
      expectedTime: subTasks.expectedTime,
      maxSameTimeWorkers: subTasks.maxSameTimeWorkers,
      linkedToPrevious: subTasks.linkedToPrevious,
      subTaskCategoryId: subTasks.subTaskCategoryId,
      taskId: tasks.id,
      taskName: tasks.name,
      taskIndex: tasks.index,
      taskQty: tasks.qty,
    })
    .from(subTasks)
    .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
    .where(inArray(subTasks.id, subTaskIds))
    .orderBy(asc(subTasks.index));
}

async function loadActivityEnrichment(
  subTaskIds: string[],
  colaboratorId: string,
  db: Db,
) {
  if (subTaskIds.length === 0) {
    return {
      startedAtBySubTaskId: new Map<string, string>(),
      completedQtyBySubTaskId: new Map<string, number>(),
      finishedAtBySubTaskId: new Map<string, string>(),
      activeColaboratorIdsBySubTaskId: new Map<string, string[]>(),
      viewerParticipatedIds: new Set<string>(),
      viewerCurrencyBySubTaskId: new Map<string, number>(),
    };
  }

  const allActivities = await db
    .select({
      subTaskId: activities.subTaskId,
      colaboratorId: activities.colaboratorId,
      action: activities.action,
      timestamp: activities.timestamp,
      qty: activities.qty,
      currencyAwarded: activities.currencyAwarded,
    })
    .from(activities)
    .where(
      and(
        inArray(activities.subTaskId, subTaskIds),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));

  const viewerActivities: SessionActivityRef[] = [];
  const viewerStopActivities: Array<{
    subTaskId: string;
    action: string;
    currencyAwarded: number;
  }> = [];
  const stoppedActivities: Array<{
    subTaskId: string;
    action: string;
    qty: number;
    timestamp: string;
  }> = [];
  const activitiesBySubTask = new Map<string, ActivityTimeRow[]>();

  for (const row of allActivities) {
    if (row.colaboratorId === colaboratorId) {
      viewerActivities.push({
        subTaskId: row.subTaskId,
        action: row.action,
        timestamp: row.timestamp.toISOString(),
      });
      viewerStopActivities.push({
        subTaskId: row.subTaskId,
        action: row.action,
        currencyAwarded: row.currencyAwarded,
      });
    }
    if (row.action === "stoped") {
      stoppedActivities.push({
        subTaskId: row.subTaskId,
        action: row.action,
        qty: row.qty,
        timestamp: row.timestamp.toISOString(),
      });
    }
    const list = activitiesBySubTask.get(row.subTaskId) ?? [];
    list.push({
      action: row.action,
      timestamp: new Date(row.timestamp),
      colaboratorId: row.colaboratorId,
    });
    activitiesBySubTask.set(row.subTaskId, list);
  }

  const openStartedAt = buildOpenStartedAtBySubTaskId(viewerActivities);
  const viewerStopStats = buildViewerStopStatsBySubTaskId(viewerStopActivities);
  const activeColaboratorIdsBySubTaskId = new Map<string, string[]>();
  for (const subTaskId of subTaskIds) {
    const activeIds = listActiveColaboratorIdsFromActivities(
      activitiesBySubTask.get(subTaskId) ?? [],
    );
    activeColaboratorIdsBySubTaskId.set(subTaskId, activeIds);
  }

  return {
    startedAtBySubTaskId: openStartedAt,
    completedQtyBySubTaskId: sumStoppedQtyBySubTaskId(stoppedActivities),
    finishedAtBySubTaskId: buildFinishedAtBySubTaskId(stoppedActivities),
    activeColaboratorIdsBySubTaskId,
    viewerParticipatedIds: viewerStopStats.participatedIds,
    viewerCurrencyBySubTaskId: viewerStopStats.currencyBySubTaskId,
  };
}

async function loadAssigneeAndDependencyMaps(
  subTaskIds: string[],
  db: Db,
) {
  if (subTaskIds.length === 0) {
    return {
      assignedToIdsBySubTaskId: new Map<string, string[]>(),
      dependencyIdsBySubTaskId: new Map<string, string[]>(),
    };
  }
  const assigneeRows = await db
    .select({
      subTaskId: subTaskAssignees.subTaskId,
      userId: subTaskAssignees.userId,
    })
    .from(subTaskAssignees)
    .where(inArray(subTaskAssignees.subTaskId, subTaskIds));
  const dependencyRows = await db
    .select({
      subTaskId: subTaskDependencies.subTaskId,
      dependsOnSubTaskId: subTaskDependencies.dependsOnSubTaskId,
    })
    .from(subTaskDependencies)
    .where(inArray(subTaskDependencies.subTaskId, subTaskIds));

  const assignedToIdsBySubTaskId = new Map<string, string[]>();
  for (const row of assigneeRows) {
    const list = assignedToIdsBySubTaskId.get(row.subTaskId) ?? [];
    list.push(row.userId);
    assignedToIdsBySubTaskId.set(row.subTaskId, list);
  }
  const dependencyIdsBySubTaskId = new Map<string, string[]>();
  for (const row of dependencyRows) {
    const list = dependencyIdsBySubTaskId.get(row.subTaskId) ?? [];
    list.push(row.dependsOnSubTaskId);
    dependencyIdsBySubTaskId.set(row.subTaskId, list);
  }
  return { assignedToIdsBySubTaskId, dependencyIdsBySubTaskId };
}

export async function reconcileProducingStatusFromOpenSessions(
  rows: Array<{
    id: string;
    status: string | null;
    taskId: string;
  }>,
  activeColaboratorIdsBySubTaskId: Map<string, string[]>,
  db: Db,
): Promise<void> {
  const idsToProduce = findSubTaskIdsNeedingProducingReconcile(
    rows,
    activeColaboratorIdsBySubTaskId,
  );
  if (idsToProduce.length === 0) return;

  const now = new Date();
  await db
    .update(subTasks)
    .set({ status: PRODUCING_STATUS, updatedAt: now })
    .where(inArray(subTasks.id, idsToProduce));

  const taskIds = new Set(
    rows
      .filter((row) => idsToProduce.includes(row.id))
      .map((row) => row.taskId),
  );
  for (const taskId of taskIds) {
    await runTaskSubTaskSyncRoutine(taskId, db, now);
  }

  for (const row of rows) {
    if (idsToProduce.includes(row.id)) {
      row.status = PRODUCING_STATUS;
    }
  }
}

async function reconcileQtyCompletePausedSubTasks(
  rows: Array<{
    id: string;
    status: string | null;
    qty: number;
    sharingType: string | null;
    taskId: string;
  }>,
  completedQtyBySubTaskId: Map<string, number>,
  activeColaboratorIdsBySubTaskId: Map<string, string[]>,
  db: Db,
): Promise<void> {
  const now = new Date();
  const idsToFinish: string[] = [];

  for (const row of rows) {
    if (row.sharingType !== "qty") continue;
    const status = String(row.status ?? "");
    if (status !== "paused" && status !== "waiting") continue;
    if ((activeColaboratorIdsBySubTaskId.get(row.id) ?? []).length > 0) {
      continue;
    }
    const completed = completedQtyBySubTaskId.get(row.id) ?? 0;
    if (!isQtyTargetFullyMet(row.qty, completed)) continue;
    idsToFinish.push(row.id);
  }

  if (idsToFinish.length === 0) return;

  await db
    .update(subTasks)
    .set({ status: "finished", updatedAt: now })
    .where(inArray(subTasks.id, idsToFinish));

  const taskIds = new Set(
    rows
      .filter((row) => idsToFinish.includes(row.id))
      .map((row) => row.taskId),
  );
  for (const taskId of taskIds) {
    await runTaskSubTaskSyncRoutine(taskId, db, now);
  }

  for (const row of rows) {
    if (idsToFinish.includes(row.id)) {
      row.status = "finished";
    }
  }
}

type AssignedSubTaskRow = Awaited<
  ReturnType<typeof fetchAssignedSubTaskRows>
>[number];

async function hydrateAssignedSubTaskRows(
  rows: AssignedSubTaskRow[],
  colaboratorId: string,
  openSessionIds: readonly string[],
  db: Db,
): Promise<KioskSubTask[]> {
  if (rows.length === 0) return [];
  const subTaskIds = rows.map((row) => row.id);
  const [enrichment, relationMaps] = await Promise.all([
    loadActivityEnrichment(subTaskIds, colaboratorId, db),
    loadAssigneeAndDependencyMaps(subTaskIds, db),
  ]);

  await reconcileProducingStatusFromOpenSessions(
    selectRowsForProducingReconcile(rows, {
      openSessionIds,
      activeColaboratorIdsBySubTaskId: enrichment.activeColaboratorIdsBySubTaskId,
    }),
    enrichment.activeColaboratorIdsBySubTaskId,
    db,
  );
  await reconcileQtyCompletePausedSubTasks(
    selectRowsForQtyCompleteReconcile(rows, {
      completedQtyBySubTaskId: enrichment.completedQtyBySubTaskId,
      activeColaboratorIdsBySubTaskId: enrichment.activeColaboratorIdsBySubTaskId,
    }),
    enrichment.completedQtyBySubTaskId,
    enrichment.activeColaboratorIdsBySubTaskId,
    db,
  );

  const now = new Date();
  const mapped = filterKioskVisibleSubTasks(
    rows
      .filter((row) => {
        const activeIds =
          enrichment.activeColaboratorIdsBySubTaskId.get(row.id) ?? [];
        return !shouldHideSubTaskFromKioskQueue({
          maxSameTimeWorkers: row.maxSameTimeWorkers,
          activeColaboratorIds: activeIds,
          viewerColaboratorId: colaboratorId,
        });
      })
      .map((row) => {
        const activeIds =
          enrichment.activeColaboratorIdsBySubTaskId.get(row.id) ?? [];
        const kioskRow = mapSubTaskDbRow(
          toSubTaskDbRow(row),
          enrichment.startedAtBySubTaskId.get(row.id) ?? null,
          enrichment.completedQtyBySubTaskId.get(row.id) ?? 0,
          enrichment.finishedAtBySubTaskId.get(row.id) ?? null,
          activeIds.length,
        );
        return {
          ...kioskRow,
          assignedToIds: relationMaps.assignedToIdsBySubTaskId.get(row.id) ?? [],
          dependencyIds: relationMaps.dependencyIdsBySubTaskId.get(row.id) ?? [],
          viewerParticipated: enrichment.viewerParticipatedIds.has(row.id),
          viewerCurrencyAwarded:
            enrichment.viewerCurrencyBySubTaskId.get(row.id) ?? 0,
        };
      })
      .filter((row) => row.documentId.length > 0),
  );

  const sorted = sortKioskDailyQueue(filterKioskDailyQueue(mapped, now));
  const categoryById = new Map(
    rows.map((row) => [row.id, row.subTaskCategoryId ?? null]),
  );

  return sorted.map((row) => ({
    documentId: row.documentId,
    name: row.name,
    index: row.index,
    status: row.status as KioskSubTask["status"],
    activationStatus: row.activationStatus,
    qty: row.qty,
    targetQty: row.targetQty,
    completedQty: row.completedQty,
    sharingType: row.sharingType,
    timeSpent: row.timeSpent,
    startedAt: row.startedAt,
    expectedTime: row.expectedTime,
    taskDocumentId: row.taskDocumentId,
    taskName: row.taskName,
    taskIndex: row.taskIndex,
    finishedAt: row.finishedAt,
    viewerParticipated: row.viewerParticipated,
    viewerCurrencyAwarded: row.viewerCurrencyAwarded,
    activeWorkerCount: row.activeWorkerCount,
    linkedToPrevious: row.linkedToPrevious,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    assignedToIds: row.assignedToIds,
    dependencyIds: row.dependencyIds,
    subTaskCategoryId: categoryById.get(row.documentId) ?? null,
  }));
}

export async function listAssignedSubTasks(
  colaboratorId: string,
  db: Db = getDb(),
  options?: { attachFlags?: boolean },
): Promise<KioskSubTask[]> {
  const [colaborator] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, colaboratorId))
    .limit(1);
  if (!colaborator) return [];

  const assignedRows = await fetchAssignedSubTaskRows(colaboratorId, db);
  const assignedIds = new Set(assignedRows.map((row) => row.id));
  const openSessionIds = await fetchOpenStartedSubTaskIdsForColaborator(
    colaboratorId,
    db,
  );
  const orphanIds = openSessionIds.filter((id) => !assignedIds.has(id));
  const orphanRows = await fetchSubTaskRowsByIds(orphanIds, db);
  const rows = [...assignedRows, ...orphanRows];
  const mapped = await hydrateAssignedSubTaskRows(
    rows,
    colaboratorId,
    openSessionIds,
    db,
  );
  if (options?.attachFlags === false) return mapped;
  return attachKioskFlagFields(mapped, db);
}

export type KioskQueueData = {
  subTasks: KioskSubTask[];
  catalog: KioskSubTask[];
  openRuns: OpenChainRun[];
};

export type KioskQueueCatalogMode = "slim" | "full";

function siblingRowToCatalogItem(
  row: Awaited<ReturnType<typeof listSubTasksWithRelationsForTasks>>[number],
  existing: KioskSubTask | undefined,
): KioskSubTask {
  if (existing) return existing;
  return {
    documentId: row.id,
    name: row.name,
    index: row.index,
    status: row.status as KioskSubTask["status"],
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
    qty: row.qty,
    targetQty: row.qty,
    completedQty: 0,
    sharingType: row.sharingType === "qty" ? "qty" : "duration",
    timeSpent: row.timeSpent,
    startedAt: null,
    expectedTime: row.expectedTime,
    taskDocumentId: row.taskId,
    taskName: "",
    taskIndex: 0,
    finishedAt: null,
    activeWorkerCount: 0,
    linkedToPrevious: row.linkedToPrevious,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    assignedToIds: row.assignedToIds,
    dependencyIds: row.dependencyIds,
    subTaskCategoryId: row.subTaskCategoryId,
  };
}

async function assembleKioskQueueData(
  subTasks: KioskSubTask[],
  colaboratorId: string,
  db: Db,
  options?: { attachCatalogFlags?: boolean },
): Promise<KioskQueueData> {
  const taskIds = [...new Set(subTasks.map((item) => item.taskDocumentId))];
  const siblingRows =
    taskIds.length > 0
      ? await listSubTasksWithRelationsForTasks(taskIds, db)
      : [];
  const assignedById = new Map(
    subTasks.map((item) => [item.documentId, item]),
  );
  const catalog: KioskSubTask[] = siblingRows.map((row) =>
    siblingRowToCatalogItem(row, assignedById.get(row.id)),
  );

  const catalogForChains =
    options?.attachCatalogFlags === false
      ? catalog
      : await attachKioskFlagFields(catalog, db);

  const chains = resolveChains(
    catalogForChains.map((item) => ({
      documentId: item.documentId,
      index: item.index,
      status: item.status,
      activationStatus: item.activationStatus,
      linkedToPrevious: item.linkedToPrevious ?? false,
      maxSameTimeWorkers: item.maxSameTimeWorkers ?? 1,
      assignedToIds: item.assignedToIds ?? [],
      dependencyIds: item.dependencyIds ?? [],
      hasAssignedFlags: (item.assignedFlagCodes?.length ?? 0) > 0,
    })),
  );
  const multiMemberChains = chains.filter(
    (chain) => chain.memberIds.length > 1,
  );
  const openByHead = await findOpenChainRunsForMemberGroups(
    multiMemberChains.map((chain) => ({
      headId: chain.headId,
      memberIds: chain.memberIds,
    })),
    db,
  );
  const openRuns: OpenChainRun[] = [];
  for (const chain of multiMemberChains) {
    const open = openByHead.get(chain.headId);
    if (!open) continue;
    openRuns.push({
      chainHeadId: chain.headId,
      chainRunId: open.chainRunId,
      principalId: open.principalId,
      runStartedAt: open.runStartedAt.toISOString(),
    });
  }

  const [subTasksWithPeer, catalogWithPeer] = await Promise.all([
    attachOpenRunPeerFields(subTasks, openRuns, colaboratorId, db),
    attachOpenRunPeerFields(
      catalogForChains.length > 0 ? catalogForChains : subTasks,
      openRuns,
      colaboratorId,
      db,
    ),
  ]);

  return {
    subTasks: subTasksWithPeer,
    catalog: catalogWithPeer,
    openRuns,
  };
}

export async function listKioskQueueData(
  colaboratorId: string,
  db: Db = getDb(),
  options?: { attachCatalogFlags?: boolean },
): Promise<KioskQueueData> {
  const subTasks = await listAssignedSubTasks(colaboratorId, db, {
    attachFlags: options?.attachCatalogFlags !== false,
  });
  return assembleKioskQueueData(subTasks, colaboratorId, db, options);
}

async function attachOpenRunPeerFields(
  items: readonly KioskSubTask[],
  openRuns: readonly OpenChainRun[],
  colaboratorId: string,
  db: Db,
): Promise<KioskSubTask[]> {
  const runIds = [
    ...new Set(
      openRuns
        .map((run) => run.chainRunId)
        .filter((id) => id.length > 0),
    ),
  ];
  if (runIds.length === 0 || items.length === 0) return [...items];

  const rows = await db
    .select({
      chainRunId: activities.chainRunId,
      subTaskId: activities.subTaskId,
      colaboratorId: activities.colaboratorId,
      action: activities.action,
      qty: activities.qty,
    })
    .from(activities)
    .where(
      and(
        inArray(activities.chainRunId, runIds),
        inArray(activities.action, ["started", "stoped"]),
      ),
    );

  const recordedBySubTask = new Map<string, number>();
  const worked = new Set<string>();
  for (const row of rows) {
    if (row.action === "stoped") {
      recordedBySubTask.set(
        row.subTaskId,
        (recordedBySubTask.get(row.subTaskId) ?? 0) + Math.max(0, row.qty),
      );
    }
    if (row.action === "started" && row.colaboratorId === colaboratorId) {
      worked.add(row.subTaskId);
    }
  }

  return items.map((item) => ({
    ...item,
    recordedQtyThisRun: recordedBySubTask.get(item.documentId) ?? 0,
    viewerWorkedThisRun: worked.has(item.documentId),
  }));
}

function flattenUnitsToSubTasks(units: readonly KioskQueueUnit[]): KioskSubTask[] {
  const byId = new Map<string, KioskSubTask>();
  for (const unit of units) {
    if (unit.type === "isolated") {
      byId.set(unit.subTask.documentId, unit.subTask);
      continue;
    }
    for (const member of unit.members) {
      byId.set(member.documentId, member);
    }
  }
  return [...byId.values()];
}

async function enrichProducingUnits(
  units: KioskQueueUnit[],
  db: Db,
): Promise<KioskQueueUnit[]> {
  return Promise.all(
    units.map(async (unit) => {
      if (unit.type === "isolated") {
        const [enriched] = await attachKioskProducingFlagFields(
          [unit.subTask],
          db,
        );
        return { ...unit, subTask: enriched ?? unit.subTask };
      }
      const members = await attachKioskProducingFlagFields(unit.members, db);
      return { ...unit, members };
    }),
  );
}

function applySubTasksToUnits(
  units: KioskQueueUnit[],
  byId: ReadonlyMap<string, KioskSubTask>,
): KioskQueueUnit[] {
  return units.map((unit) => {
    if (unit.type === "isolated") {
      return {
        ...unit,
        subTask: byId.get(unit.subTask.documentId) ?? unit.subTask,
      };
    }
    return {
      ...unit,
      members: unit.members.map(
        (member) => byId.get(member.documentId) ?? member,
      ),
    };
  });
}

export type KioskQueueSectionPage = {
  section: KioskQueueSectionKey;
  producingUnits: KioskQueueUnit[];
  units: KioskQueueUnit[];
  nextCursor: string | null;
  hasMore: boolean;
  openRuns: OpenChainRun[];
  subTasks: KioskSubTask[];
  catalog: KioskSubTask[];
  queuePageSize: number;
  catalogTruncated?: boolean;
};

export function emptyKioskQueueSectionPage(
  queuePageSize = DEFAULT_KIOSK_QUEUE_PAGE_SIZE,
): KioskQueueSectionPage {
  return {
    section: "liberadas",
    producingUnits: [],
    units: [],
    nextCursor: null,
    hasMore: false,
    openRuns: [],
    subTasks: [],
    catalog: [],
    queuePageSize,
    catalogTruncated: true,
  };
}

export async function listKioskQueueSectionPage(
  input: {
    colaboratorId: string;
    section: KioskQueueSectionKey;
    cursor?: string | null;
    liveChainIntervalSeconds?: number;
    queuePageSize?: number;
    catalogMode?: KioskQueueCatalogMode;
    queue?: KioskQueueData;
  },
  db: Db = getDb(),
): Promise<KioskQueueSectionPage> {
  let queuePageSize = input.queuePageSize;
  if (queuePageSize == null) {
    const settings = await getKioskSettings(db);
    queuePageSize = normalizeKioskQueuePageSize(
      Number(settings?.queuePageSize ?? DEFAULT_KIOSK_QUEUE_PAGE_SIZE),
    );
  }

  const catalogMode = input.catalogMode ?? "slim";
  const queue =
    input.queue ??
    (await listKioskQueueData(input.colaboratorId, db, {
      attachCatalogFlags: catalogMode === "full",
    }));
  const liveChainIntervalSeconds = input.liveChainIntervalSeconds ?? 0;
  const units = buildKioskQueueUnits({
    viewerId: input.colaboratorId,
    subTasks: queue.subTasks,
    allTaskSubTasks: queue.catalog,
    openRuns: queue.openRuns,
    maxSimultaneousSubtaskIntervalSeconds: liveChainIntervalSeconds,
  });
  const sections = splitQueueUnitsByKioskSection(units);

  const isFirstPage = !input.cursor;
  let producingUnits: KioskQueueUnit[] = [];
  let source: KioskQueueUnit[] = [];

  if (input.section === "liberadas") {
    if (isFirstPage) {
      producingUnits = await enrichProducingUnits(sections.producing, db);
    }
    source = sections.unlockedPending;
  } else if (input.section === "bloqueadas") {
    source = sections.locked;
  } else {
    source = sections.finishedToday;
  }

  const page = paginateQueueUnits(source, {
    limit: queuePageSize,
    cursor: input.cursor,
  });

  const scope = collectKioskQueueCatalogScope({
    viewerId: input.colaboratorId,
    producingUnits,
    pageUnits: page.units,
    openRuns: queue.openRuns,
    assignedSubTasks: queue.subTasks,
    fullCatalog: queue.catalog,
    maxIntervalSeconds: liveChainIntervalSeconds,
  });
  let scopedCatalog = filterCatalogByScope(queue.catalog, scope);
  if (catalogMode === "slim") {
    scopedCatalog = await attachKioskFlagFields(scopedCatalog, db);
    const flaggedById = new Map(
      scopedCatalog.map((item) => [item.documentId, item]),
    );
    page.units = applySubTasksToUnits(page.units, flaggedById);
  }

  const producingById = new Map(
    flattenUnitsToSubTasks(producingUnits).map((item) => [
      item.documentId,
      item,
    ]),
  );
  scopedCatalog = scopedCatalog.map(
    (item) => producingById.get(item.documentId) ?? item,
  );

  const visibleUnits = [...producingUnits, ...page.units];
  const pageSubTasks = flattenUnitsToSubTasks(visibleUnits);
  const catalogTruncated = scopedCatalog.length < queue.catalog.length;

  return {
    section: input.section,
    producingUnits,
    units: page.units,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
    openRuns: queue.openRuns,
    subTasks: pageSubTasks,
    catalog: catalogMode === "full" ? queue.catalog : scopedCatalog,
    queuePageSize,
    catalogTruncated: catalogMode === "slim" ? catalogTruncated : false,
  };
}

export async function listKioskProducingSnapshot(
  colaboratorId: string,
  db: Db = getDb(),
  options?: {
    liveChainIntervalSeconds?: number;
    queuePageSize?: number;
  },
): Promise<KioskQueueSectionPage> {
  const queuePageSize =
    options?.queuePageSize ?? DEFAULT_KIOSK_QUEUE_PAGE_SIZE;
  const empty = {
    ...emptyKioskQueueSectionPage(queuePageSize),
    hasMore: true,
  };
  const openSessionIds = await fetchOpenStartedSubTaskIdsForColaborator(
    colaboratorId,
    db,
  );
  if (openSessionIds.length === 0) return empty;

  const rows = await fetchSubTaskRowsByIds(openSessionIds, db);
  const subTasks = await hydrateAssignedSubTaskRows(
    rows,
    colaboratorId,
    openSessionIds,
    db,
  );
  if (subTasks.length === 0) return empty;

  const liveChainIntervalSeconds = options?.liveChainIntervalSeconds ?? 0;
  const queue = await assembleKioskQueueData(subTasks, colaboratorId, db, {
    attachCatalogFlags: false,
  });
  const units = buildKioskQueueUnits({
    viewerId: colaboratorId,
    subTasks: queue.subTasks,
    allTaskSubTasks: queue.catalog,
    openRuns: queue.openRuns,
    maxSimultaneousSubtaskIntervalSeconds: liveChainIntervalSeconds,
  });
  const sections = splitQueueUnitsByKioskSection(units);
  const producingUnits = await enrichProducingUnits(sections.producing, db);
  const pageSubTasks = flattenUnitsToSubTasks(producingUnits);
  const scope = collectKioskQueueCatalogScope({
    viewerId: colaboratorId,
    producingUnits,
    pageUnits: [],
    openRuns: queue.openRuns,
    assignedSubTasks: queue.subTasks,
    fullCatalog: queue.catalog,
    maxIntervalSeconds: liveChainIntervalSeconds,
  });
  const scopedCatalog = filterCatalogByScope(queue.catalog, scope);

  return {
    section: "liberadas",
    producingUnits,
    units: [],
    nextCursor: null,
    hasMore: true,
    openRuns: queue.openRuns,
    subTasks: pageSubTasks,
    catalog: scopedCatalog,
    queuePageSize,
    catalogTruncated: true,
  };
}

async function sumStoppedQty(subTaskId: string, db: Db): Promise<number> {
  const rows = await db
    .select({ qty: activities.qty })
    .from(activities)
    .where(
      and(
        eq(activities.subTaskId, subTaskId),
        eq(activities.action, "stoped"),
      ),
    );
  return rows.reduce((sum, row) => sum + Math.max(0, row.qty), 0);
}

async function fetchActiveColaboratorIdsForSubTask(
  subTaskId: string,
  db: Db,
): Promise<string[]> {
  const rows = await db
    .select({
      colaboratorId: activities.colaboratorId,
      action: activities.action,
      timestamp: activities.timestamp,
    })
    .from(activities)
    .where(
      and(
        eq(activities.subTaskId, subTaskId),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));

  const activityRows: ActivityTimeRow[] = rows.map((row) => ({
    colaboratorId: row.colaboratorId,
    action: row.action,
    timestamp: new Date(row.timestamp),
  }));

  return listActiveColaboratorIdsFromActivities(activityRows);
}

export async function startSubTask(
  colaboratorId: string,
  subTaskId: string,
  db: Db = getDb(),
  timestamp: Date = new Date(),
): Promise<void> {
  await assertSubTaskAssigned(colaboratorId, subTaskId, db);

  const [sub] = await db
    .select()
    .from(subTasks)
    .where(eq(subTasks.id, subTaskId))
    .limit(1);
  if (!sub) throw new Error("notFound");

  const status = String(sub.status ?? "");
  if (
    status !== "waiting" &&
    status !== PRODUCING_STATUS &&
    status !== "paused"
  ) {
    throw new Error("forbidden");
  }

  const activation = fromDrizzleActivationStatus(sub.activationStatus);
  if (activation === "disabled") throw new Error("forbidden");

  const helperChainRunId = await attachHelperStartToOpenRun(
    colaboratorId,
    subTaskId,
    db,
  );
  const helperJoinAllowed =
    Boolean(helperChainRunId) &&
    (status === "waiting" || status === "paused");
  if (
    activation !== UNLOCKED_ACTIVATION &&
    status !== PRODUCING_STATUS &&
    !helperJoinAllowed
  ) {
    throw new Error("forbidden");
  }

  const activeIds = await fetchActiveColaboratorIdsForSubTask(subTaskId, db);
  if (activeIds.includes(colaboratorId)) throw new Error("forbidden");
  if (isSubTaskAtWorkerCapacity(sub.maxSameTimeWorkers, activeIds.length)) {
    throw new Error("forbidden");
  }

  if (sub.sharingType === "qty") {
    const completed = await sumStoppedQty(subTaskId, db);
    const targetQty = resolveSubTaskTargetQty(sub.qty);
    if (targetQty - completed <= 0) {
      throw new Error("forbidden");
    }
  }

  await db.transaction(async (tx) => {
    const chainRunId = helperChainRunId;
    await tx.insert(activities).values({
      subTaskId,
      colaboratorId,
      action: "started",
      timestamp,
      qty: 0,
      currencyAwarded: 0,
      chainRunId: chainRunId ?? undefined,
    });

    await tx
      .update(subTasks)
      .set({ status: PRODUCING_STATUS, updatedAt: timestamp })
      .where(eq(subTasks.id, subTaskId));

    await runTaskSubTaskSyncRoutine(sub.taskId, tx as unknown as Db, timestamp);
  });
}

async function creditStopCurrency(
  input: {
    subTaskId: string;
    colaboratorId: string;
    activityId: string;
    subTaskStatus: string;
    sharingType: string;
    expectedTime: number;
    subTaskQty: number;
    taskQty: number;
    sessionQty: number;
    timestamp: Date;
  },
  db: Db,
): Promise<number> {
  const currency = await resolvePaymentCurrency(db);
  if (!currency) return 0;

  let currencyAwarded = 0;

  if (input.sharingType === "qty" && input.sessionQty > 0) {
    currencyAwarded = calculateQtySessionCurrency(
      {
        expectedTime: input.expectedTime,
        qty: input.subTaskQty,
        taskQty: input.taskQty,
        sharingType: "qty",
      },
      { sessionQty: input.sessionQty },
      { currencyPerSecond: Number(currency.currencyPerSecond) },
    );
  } else if (
    input.sharingType === "duration" &&
    shouldCreditDurationCurrency({
      action: "stoped",
      subTaskStatus: input.subTaskStatus,
    })
  ) {
    const activityRows = await db
      .select({
        colaboratorId: activities.colaboratorId,
        action: activities.action,
        timestamp: activities.timestamp,
      })
      .from(activities)
      .where(
        and(
          eq(activities.subTaskId, input.subTaskId),
          inArray(activities.action, ["started", "stoped"]),
        ),
      )
      .orderBy(asc(activities.timestamp));

    const rows: ActivityTimeRow[] = activityRows.map((row) => ({
      colaboratorId: row.colaboratorId,
      action: row.action,
      timestamp: new Date(row.timestamp),
    }));

    const participations = listTimeSpentByColaborator(rows, input.timestamp);
    const credits = calculateDurationCurrencyCredits(
      {
        expectedTime: input.expectedTime,
        qty: input.subTaskQty,
        taskQty: input.taskQty,
        sharingType: "duration",
      },
      participations.map((row) => ({
        colaboratorId: row.colaboratorId,
        timeSpentSeconds: row.timeSpentSeconds,
      })),
      { currencyPerSecond: Number(currency.currencyPerSecond) },
    );

    for (const credit of credits) {
      if (credit.amount <= 0) continue;
      const balance = await getOrCreateMonthlyBalance(
        {
          userId: credit.colaboratorId,
          currencyPluralTitle: resolveCurrencyPluralTitle(currency),
          now: input.timestamp,
        },
        db,
      );
      await creditBalanceIncome(
        { balanceId: balance.id, amount: credit.amount },
        db,
      );
      if (credit.colaboratorId === input.colaboratorId) {
        currencyAwarded = credit.amount;
      }
    }
  }

  if (currencyAwarded > 0) {
    await db
      .update(activities)
      .set({ currencyAwarded })
      .where(eq(activities.id, input.activityId));
  }

  return currencyAwarded;
}

export async function stopSubTask(
  colaboratorId: string,
  subTaskId: string,
  body: KioskStopBody = {},
  db: Db = getDb(),
  timestamp: Date = new Date(),
): Promise<{ remainingWorkerNames: string[] }> {
  const [sub] = await db
    .select()
    .from(subTasks)
    .where(eq(subTasks.id, subTaskId))
    .limit(1);
  if (!sub) throw new Error("notFound");

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, sub.taskId))
    .limit(1);
  if (!task) throw new Error("notFound");

  const sessionActivities = await db
    .select({
      action: activities.action,
      timestamp: activities.timestamp,
    })
    .from(activities)
    .where(
      and(
        eq(activities.subTaskId, subTaskId),
        eq(activities.colaboratorId, colaboratorId),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));

  const sessionActions = sessionActivities.map((row) => row.action);
  if (!canAuthorizeKioskStop(hasOpenStartedSessionFromActions(sessionActions))) {
    throw new Error("forbidden");
  }

  const activeIdsBefore = await fetchActiveColaboratorIdsForSubTask(subTaskId, db);
  const openStarted = [...sessionActivities]
    .reverse()
    .find((activity) => activity.action === "started");

  const sessionSeconds = openStarted
    ? calculateActivityDurationSeconds(
        new Date(openStarted.timestamp),
        timestamp,
      )
    : 0;

  const sharingType = sub.sharingType === "qty" ? "qty" : "duration";
  const taskQty = task.qty;

  const totalStoppedQty =
    sharingType === "qty" ? await sumStoppedQty(subTaskId, db) : 0;
  const sessionQty =
    sharingType === "qty" ? parseQtyStopBody(body) : 0;

  const baseStopResult =
    sharingType === "qty"
      ? resolveQtyStop(
          resolveSubTaskTargetQty(sub.qty),
          totalStoppedQty,
          sessionQty,
        )
      : resolveDurationStop(parseDurationStopBody(body));

  const remainingActiveIds = activeIdsBefore.filter(
    (id) => id !== colaboratorId,
  );
  const openRun = await findOpenChainRunForSubTask(subTaskId, db);
  const chainRunId =
    openRun?.chainRunId ??
    (await findLatestChainRunIdForSubTask(subTaskId, colaboratorId, db));
  const qtyTargetMet =
    sharingType === "qty" &&
    isQtyTargetFullyMet(resolveSubTaskTargetQty(sub.qty), totalStoppedQty);
  const wouldComplete =
    remainingActiveIds.length === 0 &&
    shouldFinalizeSubTaskOnStop(baseStopResult, qtyTargetMet);
  const flagIds = body.flagIds ?? [];
  const existingFlagIds = await listFlagIdsForSubTask(subTaskId, db);
  const mergedFlagIds = mergeFlagIds(existingFlagIds, flagIds);
  const hasDependents = await subTaskHasDependents(subTaskId, db);
  let categoryForFinish = sub.subTaskCategoryId ?? null;
  if (!categoryForFinish && flagIds.length > 0) {
    const flagRows = await db
      .select({ categoryId: flags.subTaskCategoryId })
      .from(flags)
      .where(inArray(flags.id, flagIds));
    categoryForFinish = resolveCategoryIdFromFlagCategories(
      null,
      flagRows.map((row) => row.categoryId),
    );
  }
  let availableCount = 0;
  if (categoryForFinish) {
    const available = await listAvailableFlagsForCategory(
      categoryForFinish,
      subTaskId,
      db,
    );
    availableCount = available.length;
  }

  if (wouldComplete) {
    assertFinishFlagsAllowed({
      willFinish: true,
      hasDependents,
      categoryId: categoryForFinish,
      totalFlagCount: mergedFlagIds.length,
      availableCount,
    });
  }

  const resolvedStop = resolveKioskStopNextStatus({
    baseStopResult,
    shouldFinalize: wouldComplete,
    isHelper: false,
    hasOpenRun: Boolean(openRun),
    remainingPeerCount: remainingActiveIds.length,
  });
  const stopResult = {
    qty: resolvedStop.qty,
    subTaskStatus: resolvedStop.subTaskStatus,
  };
  const nextStatusPreview = resolvedStop.nextStatus;

  let activityId = "";

  await db.transaction(async (tx) => {
    const nextStatus = nextStatusPreview;
    await tx
      .update(subTasks)
      .set({
        status: nextStatus,
        timeSpent: sub.timeSpent + sessionSeconds,
        updatedAt: timestamp,
      })
      .where(eq(subTasks.id, subTaskId));

    if (flagIds.length > 0) {
      await assignFlagsToSubTask(subTaskId, flagIds, tx as unknown as Db);
    }

    const [created] = await tx
      .insert(activities)
      .values({
        subTaskId,
        colaboratorId,
        action: "stoped",
        timestamp,
        qty: stopResult.qty,
        currencyAwarded: 0,
        chainRunId: chainRunId ?? undefined,
      })
      .returning({ id: activities.id });

    activityId = created!.id;

    await runTaskSubTaskSyncRoutine(sub.taskId, tx as unknown as Db, timestamp);
    await releaseProducerFlagsWhenConsumersFinished(
      sub.taskId,
      tx as unknown as Db,
    );

    if (sharingType === "qty" || !chainRunId) {
      await creditStopCurrency(
        {
          subTaskId,
          colaboratorId,
          activityId,
          subTaskStatus: stopResult.subTaskStatus,
          sharingType,
          expectedTime: sub.expectedTime,
          subTaskQty: sub.qty,
          taskQty,
          sessionQty: stopResult.qty,
          timestamp,
        },
        tx as unknown as Db,
      );
    }
  });

  const stillOpen = chainRunId
    ? await findOpenChainRunForSubTask(subTaskId, db)
    : null;
  if (
    chainRunId &&
    sharingType !== "qty" &&
    remainingActiveIds.length === 0 &&
    !stillOpen
  ) {
    await reallocateChainRunAfterHelperStop(chainRunId, timestamp, db);
  }

  void activityId;

  const remainingWorkerNames =
    remainingActiveIds.length > 0
      ? await fetchUserNamesByIds(remainingActiveIds, db)
      : [];

  return { remainingWorkerNames };
}

export async function recordActivityViaKiosk(
  input: {
    subTaskId: string;
    colaboratorId: string;
    action: "started" | "stoped";
    qty?: number;
    completed?: boolean;
    timestamp?: Date;
  },
  db: Db = getDb(),
) {
  const timestamp = input.timestamp ?? new Date();
  if (input.action === "started") {
    await startSubTask(input.colaboratorId, input.subTaskId, db, timestamp);
    return { currencyAwarded: 0 };
  }

  const body: KioskStopBody =
    input.qty !== undefined
      ? { qty: input.qty }
      : { completed: input.completed ?? false };

  const result = await stopSubTask(
    input.colaboratorId,
    input.subTaskId,
    body,
    db,
    timestamp,
  );

  const [activity] = await db
    .select({ currencyAwarded: activities.currencyAwarded })
    .from(activities)
    .where(
      and(
        eq(activities.subTaskId, input.subTaskId),
        eq(activities.colaboratorId, input.colaboratorId),
        eq(activities.action, "stoped"),
      ),
    )
    .orderBy(desc(activities.timestamp))
    .limit(1);

  return {
    currencyAwarded: activity?.currencyAwarded ?? 0,
    remainingWorkerNames: result.remainingWorkerNames,
  };
}
