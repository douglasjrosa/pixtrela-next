import { and, asc, desc, eq, inArray } from "drizzle-orm";

import {
  activities,
  currencies,
  currencyForSubtasks,
  subTaskAssignees,
  subTaskDependencies,
  subTasks,
  tasks,
  users,
} from "@/drizzle/schema";
import { calculateActivityDurationSeconds } from "@/lib/business/activity-duration";
import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import { resolveChains } from "@/lib/business/subtask-chain";
import { listSubTasksWithRelationsForTasks } from "@/lib/repos/tasks";
import {
  filterKioskDailyQueue,
  sortKioskDailyQueue,
} from "@/lib/business/kiosk-daily-queue";
import {
  buildFinishedAtBySubTaskId,
  buildOpenStartedAtBySubTaskId,
  filterKioskVisibleSubTasks,
  mapSubTaskDbRow,
  sumStoppedQtyBySubTaskId,
  type SessionActivityRef,
  type SubTaskDbRow,
} from "@/lib/business/kiosk-subtask-map";
import {
  canAuthorizeKioskStop,
  parseDurationStopBody,
  parseQtyStopBody,
  resolveDurationStop,
  resolveQtyStop,
  resolveStopStatusWithPeers,
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
    };
  }

  const allActivities = await db
    .select({
      subTaskId: activities.subTaskId,
      colaboratorId: activities.colaboratorId,
      action: activities.action,
      timestamp: activities.timestamp,
      qty: activities.qty,
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

export async function listAssignedSubTasks(
  colaboratorId: string,
  db: Db = getDb(),
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

  const subTaskIds = rows.map((row) => row.id);
  const [enrichment, relationMaps] = await Promise.all([
    loadActivityEnrichment(subTaskIds, colaboratorId, db),
    loadAssigneeAndDependencyMaps(subTaskIds, db),
  ]);

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
        };
      })
      .filter((row) => row.documentId.length > 0),
  );

  const sorted = sortKioskDailyQueue(filterKioskDailyQueue(mapped, now));

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
    activeWorkerCount: row.activeWorkerCount,
    linkedToPrevious: row.linkedToPrevious,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    assignedToIds: row.assignedToIds,
    dependencyIds: row.dependencyIds,
  }));
}

export type KioskQueueData = {
  subTasks: KioskSubTask[];
  catalog: KioskSubTask[];
  openRuns: OpenChainRun[];
};

export async function listKioskQueueData(
  colaboratorId: string,
  db: Db = getDb(),
): Promise<KioskQueueData> {
  const subTasks = await listAssignedSubTasks(colaboratorId, db);
  const taskIds = [...new Set(subTasks.map((item) => item.taskDocumentId))];
  const siblingRows = await listSubTasksWithRelationsForTasks(taskIds, db);
  const assignedById = new Map(
    subTasks.map((item) => [item.documentId, item]),
  );
  const catalog: KioskSubTask[] = siblingRows.map((row) => {
    const existing = assignedById.get(row.id);
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
    };
  });

  const chains = resolveChains(
    catalog.map((item) => ({
      documentId: item.documentId,
      index: item.index,
      status: item.status,
      activationStatus: item.activationStatus,
      linkedToPrevious: item.linkedToPrevious ?? false,
      maxSameTimeWorkers: item.maxSameTimeWorkers ?? 1,
      assignedToIds: item.assignedToIds ?? [],
      dependencyIds: item.dependencyIds ?? [],
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

  return {
    subTasks,
    catalog: catalog.length > 0 ? catalog : subTasks,
    openRuns,
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
      { currencyPerSecond: currency.currencyPerSecond },
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
      { currencyPerSecond: currency.currencyPerSecond },
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

  const baseStopResult =
    sharingType === "qty"
      ? resolveQtyStop(
          resolveSubTaskTargetQty(sub.qty, taskQty),
          await sumStoppedQty(subTaskId, db),
          parseQtyStopBody(body),
        )
      : resolveDurationStop(parseDurationStopBody(body));

  const remainingActiveIds = activeIdsBefore.filter(
    (id) => id !== colaboratorId,
  );
  const openRun = await findOpenChainRunForSubTask(subTaskId, db);
  const helperRunId =
    openRun?.principalId === colaboratorId
      ? null
      : (openRun?.chainRunId ??
        (await findLatestChainRunIdForSubTask(subTaskId, colaboratorId, db)));
  const isHelper = Boolean(helperRunId);
  const helperSafeBase =
    isHelper && openRun && baseStopResult.subTaskStatus === "finished"
      ? { ...baseStopResult, subTaskStatus: "waiting" as const }
      : baseStopResult;
  const stopResult = resolveStopStatusWithPeers(
    helperSafeBase,
    remainingActiveIds.length,
  );

  let activityId = "";

  await db.transaction(async (tx) => {
    const nextStatus =
      isHelper &&
      remainingActiveIds.length === 0 &&
      stopResult.subTaskStatus !== "finished"
        ? openRun
          ? "paused"
          : stopResult.subTaskStatus
        : stopResult.subTaskStatus;
    await tx
      .update(subTasks)
      .set({
        status: nextStatus,
        timeSpent: sub.timeSpent + sessionSeconds,
        updatedAt: timestamp,
      })
      .where(eq(subTasks.id, subTaskId));

    const [created] = await tx
      .insert(activities)
      .values({
        subTaskId,
        colaboratorId,
        action: "stoped",
        timestamp,
        qty: stopResult.qty,
        currencyAwarded: 0,
        chainRunId: helperRunId ?? openRun?.chainRunId,
      })
      .returning({ id: activities.id });

    activityId = created!.id;

    await runTaskSubTaskSyncRoutine(sub.taskId, tx as unknown as Db, timestamp);

    const stampChainRunId = helperRunId ?? undefined;
    if (!stampChainRunId) {
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

  if (isHelper && helperRunId && !openRun) {
    await reallocateChainRunAfterHelperStop(helperRunId, timestamp, db);
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
