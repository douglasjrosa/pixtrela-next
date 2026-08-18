import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";

import { activities, subTasks, tasks } from "@/drizzle/schema";
import {
  allocateChainTimeline,
  elapsedSecondsBetween,
  isFinishedThisRun,
  planPrincipalSegmentActivities,
  resolveChainAutoAdvance,
  statusAfterChainTimeAdvance,
  type AllocationMember,
  type ChainStopAnswer,
} from "@/lib/business/subtask-chain-allocation";
import {
  calculateChainRunCredits,
  diffChainRunCredits,
} from "@/lib/business/subtask-chain-credits";
import {
  chainHasExternalDependencyBlock,
  findChainContaining,
  remainingExecutableMembers,
  resolveChains,
  type ChainSubTask,
} from "@/lib/business/subtask-chain";
import {
  nextJoinableSibling,
  normalizeKioskLiveChainIntervalSeconds,
  type LiveChainMember,
} from "@/lib/business/kiosk-live-chain";
import { getKioskSettings } from "@/lib/repos/settings";
import { DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS } from "@/lib/schemas/kiosk-setting";
import { hasOpenStartedSessionFromActions } from "@/lib/business/subtask-active-workers";
import { resolveSubTaskTargetQty } from "@/lib/domain/work-currency";
import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import { getDb, type Db } from "@/lib/db/client";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import {
  adjustBalanceIncome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import {
  listSubTasksWithRelationsForTask,
  updateSubTaskLinkedToPrevious,
  type SubTaskWithAssignees,
} from "@/lib/repos/tasks";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";
import { currencies, currencyForSubtasks } from "@/drizzle/schema";

const PRODUCING_STATUS = "producing";
const WAITING_STATUS = "waiting";
const FINISHED_STATUS = "finished";

export type ChainStopMemberAnswer = ChainStopAnswer;

type ChainActivityRow = {
  id: string;
  subTaskId: string;
  colaboratorId: string;
  action: "started" | "stoped";
  timestamp: Date;
  qty: number;
  currencyAwarded: number;
  chainRunId: string | null;
};

function toChainItem(row: SubTaskWithAssignees): ChainSubTask {
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

async function loadChainContext(subTaskId: string, db: Db) {
  const [sub] = await db
    .select()
    .from(subTasks)
    .where(eq(subTasks.id, subTaskId))
    .limit(1);
  if (!sub) throw new Error("notFound");
  const siblings = await listSubTasksWithRelationsForTask(sub.taskId, db);
  const items = siblings.map(toChainItem);
  const chains = resolveChains(items);
  const chain = findChainContaining(chains, subTaskId);
  if (!chain) throw new Error("notFound");
  const byId = new Map(items.map((item) => [item.documentId, item]));
  return { sub, siblings, items, chain, byId };
}

async function loadRunActivities(
  chainRunId: string,
  db: Db,
): Promise<ChainActivityRow[]> {
  const rows = await db
    .select({
      id: activities.id,
      subTaskId: activities.subTaskId,
      colaboratorId: activities.colaboratorId,
      action: activities.action,
      timestamp: activities.timestamp,
      qty: activities.qty,
      currencyAwarded: activities.currencyAwarded,
      chainRunId: activities.chainRunId,
    })
    .from(activities)
    .where(eq(activities.chainRunId, chainRunId))
    .orderBy(asc(activities.timestamp));
  return rows.map((row) => ({
    ...row,
    action: row.action === "stoped" ? "stoped" : "started",
  }));
}

function principalIdFromRun(rows: ChainActivityRow[]): string | null {
  const started = rows.find((row) => row.action === "started");
  return started?.colaboratorId ?? null;
}

function runStartedAtFromRows(rows: ChainActivityRow[]): Date | null {
  const started = rows.find((row) => row.action === "started");
  return started?.timestamp ?? null;
}

function hasOpenSession(
  rows: ChainActivityRow[],
  colaboratorId: string,
  subTaskId: string,
): boolean {
  const actions = rows
    .filter(
      (row) =>
        row.colaboratorId === colaboratorId && row.subTaskId === subTaskId,
    )
    .map((row) => row.action);
  return hasOpenStartedSessionFromActions(actions);
}

export type OpenChainRunRef = {
  chainRunId: string;
  principalId: string;
  runStartedAt: Date;
};

type ChainActivityLookupRow = {
  chainRunId: string | null;
  colaboratorId: string;
  action: "started" | "stoped";
  timestamp: Date;
  subTaskId: string;
};

export function resolveOpenChainRunFromActivityRows(
  rows: readonly ChainActivityLookupRow[],
): OpenChainRunRef | null {
  const byRun = new Map<string, ChainActivityLookupRow[]>();
  for (const row of rows) {
    if (!row.chainRunId) continue;
    const list = byRun.get(row.chainRunId) ?? [];
    list.push(row);
    byRun.set(row.chainRunId, list);
  }

  for (const [chainRunId, list] of byRun) {
    const principal = list.find((row) => row.action === "started");
    if (!principal) continue;
    const actions = list
      .filter((row) => row.colaboratorId === principal.colaboratorId)
      .map((row) => row.action);
    if (!hasOpenStartedSessionFromActions(actions)) continue;
    return {
      chainRunId,
      principalId: principal.colaboratorId,
      runStartedAt: principal.timestamp,
    };
  }
  return null;
}

async function listChainActivityLookupRows(
  subTaskIds: readonly string[],
  db: Db,
): Promise<ChainActivityLookupRow[]> {
  if (subTaskIds.length === 0) return [];
  return db
    .select({
      chainRunId: activities.chainRunId,
      colaboratorId: activities.colaboratorId,
      action: activities.action,
      timestamp: activities.timestamp,
      subTaskId: activities.subTaskId,
    })
    .from(activities)
    .where(
      and(
        inArray(activities.subTaskId, [...subTaskIds]),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));
}

export async function findOpenChainRunId(input: {
  subTaskIds: string[];
  db?: Db;
}): Promise<OpenChainRunRef | null> {
  const db = input.db ?? getDb();
  const rows = await listChainActivityLookupRows(input.subTaskIds, db);
  return resolveOpenChainRunFromActivityRows(rows);
}

export async function findOpenChainRunsForMemberGroups(
  groups: readonly { headId: string; memberIds: readonly string[] }[],
  db: Db = getDb(),
): Promise<Map<string, OpenChainRunRef>> {
  const allIds = [...new Set(groups.flatMap((group) => group.memberIds))];
  const rows = await listChainActivityLookupRows(allIds, db);
  const result = new Map<string, OpenChainRunRef>();
  for (const group of groups) {
    const memberIds = new Set(group.memberIds);
    const open = resolveOpenChainRunFromActivityRows(
      rows.filter((row) => memberIds.has(row.subTaskId)),
    );
    if (open) result.set(group.headId, open);
  }
  return result;
}

export async function findLatestChainRunIdForSubTask(
  subTaskId: string,
  colaboratorId: string,
  db: Db = getDb(),
): Promise<string | null> {
  const rows = await db
    .select({
      chainRunId: activities.chainRunId,
      timestamp: activities.timestamp,
    })
    .from(activities)
    .where(
      and(
        eq(activities.subTaskId, subTaskId),
        eq(activities.colaboratorId, colaboratorId),
      ),
    )
    .orderBy(asc(activities.timestamp));
  const withRun = [...rows].reverse().find((row) => row.chainRunId);
  return withRun?.chainRunId ?? null;
}

export async function startChain(
  colaboratorId: string,
  headId: string,
  db: Db = getDb(),
  timestamp: Date = new Date(),
): Promise<{ chainRunId: string }> {
  const { sub, items, chain, byId } = await loadChainContext(headId, db);
  const remaining = remainingExecutableMembers(chain, byId);
  if (remaining.length === 0) throw new Error("forbidden");
  const startMember = remaining[0]!;
  if (
    chainHasExternalDependencyBlock(
      new Set(chain.memberIds),
      remaining,
      new Map(items.map((item) => [item.documentId, item])),
    )
  ) {
    throw new Error("forbidden");
  }
  if (!startMember.assignedToIds.includes(colaboratorId)) {
    throw new Error("forbidden");
  }

  const open = await findOpenChainRunId({
    subTaskIds: chain.memberIds,
    db,
  });
  if (open) throw new Error("forbidden");

  const chainRunId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(activities).values({
      subTaskId: startMember.documentId,
      colaboratorId,
      action: "started",
      timestamp,
      qty: 0,
      currencyAwarded: 0,
      chainRunId,
    });
    await tx
      .update(subTasks)
      .set({ status: PRODUCING_STATUS, updatedAt: timestamp })
      .where(eq(subTasks.id, startMember.documentId));
    await runTaskSubTaskSyncRoutine(sub.taskId, tx as unknown as Db, timestamp);
  });

  return { chainRunId };
}

export async function advanceChainRun(
  chainRunId: string,
  db: Db = getDb(),
  now: Date = new Date(),
): Promise<void> {
  const runRows = await loadRunActivities(chainRunId, db);
  const principalId = principalIdFromRun(runRows);
  const runStartedAt = runStartedAtFromRows(runRows);
  if (!principalId || !runStartedAt) throw new Error("notFound");

  const firstSubTaskId = runRows[0]?.subTaskId;
  if (!firstSubTaskId) return;
  const { sub, chain, byId } = await loadChainContext(firstSubTaskId, db);
  const remaining = remainingExecutableMembers(chain, byId);
  const expectedById = new Map(
    (await listSubTasksWithRelationsForTask(sub.taskId, db)).map((row) => [
      row.id,
      row,
    ]),
  );
  const remainingForClock = remaining.map((item) => ({
    documentId: item.documentId,
    expectedTime: expectedById.get(item.documentId)?.expectedTime ?? 0,
  }));

  const advance = resolveChainAutoAdvance({
    runStartedAt,
    now,
    remainingOrdered: remainingForClock,
  });
  if (!advance.currentId) return;

  const principalOpen = remaining.find((item) =>
    hasOpenSession(runRows, principalId, item.documentId),
  );
  const currentOpenId = principalOpen?.documentId ?? null;
  if (currentOpenId === advance.currentId) return;

  await db.transaction(async (tx) => {
    for (const completedId of advance.completedIds) {
      if (hasOpenSession(runRows, principalId, completedId)) {
        await tx.insert(activities).values({
          subTaskId: completedId,
          colaboratorId: principalId,
          action: "stoped",
          timestamp: now,
          qty: 0,
          currencyAwarded: 0,
          chainRunId,
        });
      }
      const [member] = await tx
        .select()
        .from(subTasks)
        .where(eq(subTasks.id, completedId))
        .limit(1);
      if (member && member.status !== FINISHED_STATUS) {
        const helperOpen = runRows.some(
          (row) =>
            row.subTaskId === completedId &&
            row.colaboratorId !== principalId &&
            hasOpenSession(runRows, row.colaboratorId, completedId),
        );
        await tx
          .update(subTasks)
          .set({
            status: statusAfterChainTimeAdvance(helperOpen),
            updatedAt: now,
          })
          .where(eq(subTasks.id, completedId));
      }
    }

    if (
      advance.currentId &&
      !hasOpenSession(runRows, principalId, advance.currentId)
    ) {
      await tx.insert(activities).values({
        subTaskId: advance.currentId,
        colaboratorId: principalId,
        action: "started",
        timestamp: now,
        qty: 0,
        currencyAwarded: 0,
        chainRunId,
      });
      await tx
        .update(subTasks)
        .set({ status: PRODUCING_STATUS, updatedAt: now })
        .where(eq(subTasks.id, advance.currentId));
    }

    await runTaskSubTaskSyncRoutine(sub.taskId, tx as unknown as Db, now);
  });
}

function principalPairSeconds(
  rows: ChainActivityRow[],
  principalId: string,
  subTaskId: string,
): number {
  const list = rows.filter(
    (row) => row.colaboratorId === principalId && row.subTaskId === subTaskId,
  );
  let started: Date | null = null;
  let total = 0;
  for (const row of list) {
    if (row.action === "started") {
      started = row.timestamp;
      continue;
    }
    if (started) {
      total += elapsedSecondsBetween(started, row.timestamp);
      started = null;
    }
  }
  return total;
}

async function sumStoppedQtyExcludingRun(
  subTaskId: string,
  chainRunId: string,
  db: Db,
): Promise<number> {
  const rows = await db
    .select({
      qty: activities.qty,
      chainRunId: activities.chainRunId,
    })
    .from(activities)
    .where(
      and(
        eq(activities.subTaskId, subTaskId),
        eq(activities.action, "stoped"),
      ),
    );
  return rows
    .filter((row) => row.chainRunId !== chainRunId)
    .reduce((sum, row) => sum + Math.max(0, row.qty), 0);
}

function allocationMemberFromRow(
  row: SubTaskWithAssignees,
  taskQty: number,
): AllocationMember {
  return {
    documentId: row.id,
    expectedTime: row.expectedTime,
    sharingType: row.sharingType === "qty" ? "qty" : "duration",
    targetQty: resolveSubTaskTargetQty(row.qty, taskQty),
    completedQtyBefore: 0,
  };
}

async function applyCreditDeltas(
  deltas: Array<{ colaboratorId: string; delta: number }>,
  timestamp: Date,
  db: Db,
): Promise<void> {
  const currency = await resolvePaymentCurrency(db);
  if (!currency) return;
  for (const row of deltas) {
    if (row.delta === 0) continue;
    const balance = await getOrCreateMonthlyBalance(
      {
        userId: row.colaboratorId,
        currencyPluralTitle: resolveCurrencyPluralTitle(currency),
        now: timestamp,
      },
      db,
    );
    await adjustBalanceIncome({ balanceId: balance.id, delta: row.delta }, db);
  }
}

async function reallocateChainRunInternal(
  chainRunId: string,
  answers: ChainStopMemberAnswer[],
  stopAt: Date,
  db: Db,
  extraHelperSeconds: number,
): Promise<void> {
  const runRows = await loadRunActivities(chainRunId, db);
  const principalId = principalIdFromRun(runRows);
  const runStartedAt = runStartedAtFromRows(runRows);
  if (!principalId || !runStartedAt) throw new Error("notFound");

  const firstSubTaskId = runRows[0]?.subTaskId;
  if (!firstSubTaskId) throw new Error("notFound");
  const { sub, siblings, chain, byId } = await loadChainContext(
    firstSubTaskId,
    db,
  );
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, sub.taskId))
    .limit(1);
  if (!task) throw new Error("notFound");

  const remaining = remainingExecutableMembers(chain, byId);
  const formMembers = remaining.length > 0
    ? remaining
    : chain.memberIds
        .map((id) => byId.get(id))
        .filter((item): item is ChainSubTask => Boolean(item))
        .filter((item) =>
          runRows.some((row) => row.subTaskId === item.documentId),
        );

  const siblingById = new Map(siblings.map((row) => [row.id, row]));
  const answersById = new Map(answers.map((row) => [row.documentId, row]));
  const allocationMembers: AllocationMember[] = [];
  for (const member of formMembers) {
    const row = siblingById.get(member.documentId);
    if (!row) continue;
    const completedQtyBefore = await sumStoppedQtyExcludingRun(
      member.documentId,
      chainRunId,
      db,
    );
    allocationMembers.push({
      ...allocationMemberFromRow(row, task.qty),
      completedQtyBefore,
    });
  }

  const finishedThisRun = allocationMembers.filter((member) =>
    isFinishedThisRun(member, answersById.get(member.documentId)),
  );
  const pendingIds = new Set(
    allocationMembers
      .filter((member) => !isFinishedThisRun(member, answersById.get(member.documentId)))
      .map((member) => member.documentId),
  );

  const timeline = allocateChainTimeline({
    runStartedAt,
    stopAt,
    extraHelperSeconds,
    finishedThisRun,
  });
  const qtyBySubTaskId: Record<string, number> = {};
  for (const answer of answers) {
    if (typeof answer.qty === "number") {
      qtyBySubTaskId[answer.documentId] = answer.qty;
    }
  }
  const planned = planPrincipalSegmentActivities({
    principalId,
    segments: timeline.segments,
    qtyBySubTaskId,
  });

  const helperOpenBySubTask = new Set<string>();
  for (const member of formMembers) {
    const helpers = new Set(
      runRows
        .filter(
          (row) =>
            row.subTaskId === member.documentId &&
            row.colaboratorId !== principalId,
        )
        .map((row) => row.colaboratorId),
    );
    for (const helperId of helpers) {
      if (hasOpenSession(runRows, helperId, member.documentId)) {
        helperOpenBySubTask.add(member.documentId);
      }
    }
  }

  const previousAwards = runRows
    .filter((row) => row.action === "stoped" && row.currencyAwarded > 0)
    .map((row) => ({
      colaboratorId: row.colaboratorId,
      subTaskId: row.subTaskId,
      amount: row.currencyAwarded,
    }));

  const participations = timeline.segments.flatMap((segment) => {
    const workers = new Set<string>([principalId]);
    for (const row of runRows) {
      if (row.subTaskId === segment.documentId) {
        workers.add(row.colaboratorId);
      }
    }
    const wallByWorker = new Map<string, number>();
    for (const workerId of workers) {
      if (workerId === principalId) {
        wallByWorker.set(workerId, segment.timeSpent);
        continue;
      }
      const started = runRows.find(
        (row) =>
          row.subTaskId === segment.documentId &&
          row.colaboratorId === workerId &&
          row.action === "started",
      );
      const stopped = [...runRows]
        .reverse()
        .find(
          (row) =>
            row.subTaskId === segment.documentId &&
            row.colaboratorId === workerId &&
            row.action === "stoped",
        );
      const helperStart = started?.timestamp ?? segment.startedAt;
      const helperStop = stopped?.timestamp ?? stopAt;
      wallByWorker.set(
        workerId,
        elapsedSecondsBetween(helperStart, helperStop),
      );
    }
    const wallSum = [...wallByWorker.values()].reduce((sum, value) => sum + value, 0);
    return [...wallByWorker.entries()].map(([colaboratorId, wall]) => ({
      colaboratorId,
      subTaskId: segment.documentId,
      timeSpentSeconds:
        wallSum > 0
          ? Math.floor((segment.timeSpent * wall) / wallSum)
          : 0,
      qty:
        colaboratorId === principalId
          ? (qtyBySubTaskId[segment.documentId] ?? 0)
          : runRows
              .filter(
                (row) =>
                  row.subTaskId === segment.documentId &&
                  row.colaboratorId === colaboratorId &&
                  row.action === "stoped",
              )
              .reduce((sum, row) => sum + row.qty, 0),
    }));
  });

  const currency = await resolvePaymentCurrency(db);
  const nextAwards = calculateChainRunCredits({
    members: finishedThisRun.map((member) => {
      const row = siblingById.get(member.documentId)!;
      return {
        documentId: member.documentId,
        sharingType: member.sharingType,
        expectedTime: member.expectedTime,
        qty: row.qty,
        taskQty: task.qty,
        finishedThisRun: true,
      };
    }),
    participations,
    currencyPerSecond: currency?.currencyPerSecond ?? 0,
  });
  const creditDeltas = diffChainRunCredits(nextAwards, previousAwards);

  await db.transaction(async (tx) => {
    for (const event of planned) {
      const existing = runRows.find(
        (row) =>
          row.subTaskId === event.subTaskId &&
          row.colaboratorId === event.colaboratorId &&
          row.action === event.action,
      );
      const award =
        event.action === "stoped"
          ? (nextAwards.find(
              (row) =>
                row.subTaskId === event.subTaskId &&
                row.colaboratorId === event.colaboratorId,
            )?.amount ?? 0)
          : 0;
      if (existing) {
        await tx
          .update(activities)
          .set({
            timestamp: event.timestamp,
            qty: event.qty,
            currencyAwarded: award,
          })
          .where(eq(activities.id, existing.id));
      } else {
        await tx.insert(activities).values({
          subTaskId: event.subTaskId,
          colaboratorId: event.colaboratorId,
          action: event.action,
          timestamp: event.timestamp,
          qty: event.qty,
          currencyAwarded: award,
          chainRunId,
        });
      }
    }

    for (const member of formMembers) {
      const row = siblingById.get(member.documentId);
      if (!row) continue;
      if (pendingIds.has(member.documentId)) {
        if (hasOpenSession(runRows, principalId, member.documentId)) {
          await tx.insert(activities).values({
            subTaskId: member.documentId,
            colaboratorId: principalId,
            action: "stoped",
            timestamp: stopAt,
            qty: answersById.get(member.documentId)?.qty ?? 0,
            currencyAwarded: 0,
            chainRunId,
          });
        } else {
          const existingStop = [...runRows]
            .reverse()
            .find(
              (row) =>
                row.subTaskId === member.documentId &&
                row.colaboratorId === principalId &&
                row.action === "stoped",
            );
          if (existingStop) {
            await tx
              .update(activities)
              .set({
                qty: answersById.get(member.documentId)?.qty ?? existingStop.qty,
              })
              .where(eq(activities.id, existingStop.id));
          }
        }
        const helperOpen = helperOpenBySubTask.has(member.documentId);
        await tx
          .update(subTasks)
          .set({
            status: helperOpen ? PRODUCING_STATUS : WAITING_STATUS,
            updatedAt: stopAt,
          })
          .where(eq(subTasks.id, member.documentId));
        continue;
      }

      const segment = timeline.segments.find(
        (item) => item.documentId === member.documentId,
      );
      const helperOpen = helperOpenBySubTask.has(member.documentId);
      const baseSpent = Math.max(
        0,
        row.timeSpent -
          principalPairSeconds(runRows, principalId, member.documentId),
      );
      await tx
        .update(subTasks)
        .set({
          status: helperOpen ? PRODUCING_STATUS : FINISHED_STATUS,
          timeSpent: baseSpent + (segment?.timeSpent ?? 0),
          updatedAt: stopAt,
        })
        .where(eq(subTasks.id, member.documentId));
    }

    await applyCreditDeltas(
      creditDeltas.map((row) => ({
        colaboratorId: row.colaboratorId,
        delta: row.delta,
      })),
      stopAt,
      tx as unknown as Db,
    );
    await runTaskSubTaskSyncRoutine(sub.taskId, tx as unknown as Db, stopAt);
  });
}

export async function confirmChainStop(
  colaboratorId: string,
  chainRunId: string,
  answers: ChainStopMemberAnswer[],
  db: Db = getDb(),
  timestamp: Date = new Date(),
): Promise<void> {
  const runRows = await loadRunActivities(chainRunId, db);
  const principalId = principalIdFromRun(runRows);
  if (principalId !== colaboratorId) throw new Error("forbidden");
  await reallocateChainRunInternal(chainRunId, answers, timestamp, db, 0);
}

export async function reallocateChainRunAfterHelperStop(
  chainRunId: string,
  helperStoppedAt: Date,
  db: Db = getDb(),
): Promise<void> {
  const runRows = await loadRunActivities(chainRunId, db);
  const principalId = principalIdFromRun(runRows);
  if (!principalId) throw new Error("notFound");
  const principalStillOpen = runRows.some((row) =>
    hasOpenSession(runRows, principalId, row.subTaskId),
  );
  if (principalStillOpen) return;

  const principalLastStop = [...runRows]
    .reverse()
    .find(
      (row) => row.colaboratorId === principalId && row.action === "stoped",
    );
  const stopAt = principalLastStop?.timestamp ?? helperStoppedAt;
  const extra = elapsedSecondsBetween(stopAt, helperStoppedAt);
  const answers: ChainStopMemberAnswer[] = [];
  const finishedIds = new Set(
    runRows
      .filter((row) => row.action === "stoped" && row.colaboratorId === principalId)
      .map((row) => row.subTaskId),
  );
  for (const subTaskId of finishedIds) {
    const qty = runRows
      .filter(
        (row) =>
          row.subTaskId === subTaskId &&
          row.action === "stoped" &&
          row.colaboratorId === principalId,
      )
      .reduce((sum, row) => sum + row.qty, 0);
    answers.push({
      documentId: subTaskId,
      completed: true,
      qty: qty > 0 ? qty : undefined,
    });
  }
  await reallocateChainRunInternal(chainRunId, answers, stopAt, db, extra);
}

export async function attachHelperStartToOpenRun(
  _colaboratorId: string,
  subTaskId: string,
  db: Db = getDb(),
): Promise<string | null> {
  const open = await findOpenChainRunForSubTask(subTaskId, db);
  if (!open) return null;
  return open.chainRunId;
}

export async function findOpenChainRunForSubTask(
  subTaskId: string,
  db: Db = getDb(),
): Promise<{
  chainRunId: string;
  principalId: string;
  runStartedAt: Date;
} | null> {
  const [sub] = await db
    .select({ id: subTasks.id, taskId: subTasks.taskId })
    .from(subTasks)
    .where(eq(subTasks.id, subTaskId))
    .limit(1);
  if (!sub) throw new Error("notFound");

  const siblings = await db
    .select({
      id: subTasks.id,
      linkedToPrevious: subTasks.linkedToPrevious,
    })
    .from(subTasks)
    .where(eq(subTasks.taskId, sub.taskId));
  if (
    siblings.length <= 1 ||
    !siblings.some((row) => row.linkedToPrevious)
  ) {
    return null;
  }

  return findOpenChainRunId({
    subTaskIds: siblings.map((row) => row.id),
    db,
  });
}

function toLiveChainMember(
  row: SubTaskWithAssignees,
  taskId: string,
): LiveChainMember {
  return {
    documentId: row.id,
    index: row.index,
    taskDocumentId: taskId,
    expectedTime: row.expectedTime,
    status: row.status,
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
  };
}

async function findOpenStartedRowsForColaborator(
  colaboratorId: string,
  db: Db,
): Promise<
  Array<{
    id: string;
    subTaskId: string;
    chainRunId: string | null;
  }>
> {
  const rows = await db
    .select({
      id: activities.id,
      subTaskId: activities.subTaskId,
      action: activities.action,
      timestamp: activities.timestamp,
      chainRunId: activities.chainRunId,
    })
    .from(activities)
    .where(
      and(
        eq(activities.colaboratorId, colaboratorId),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));

  const bySubTask = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = bySubTask.get(row.subTaskId) ?? [];
    list.push(row);
    bySubTask.set(row.subTaskId, list);
  }

  const open: Array<{
    id: string;
    subTaskId: string;
    chainRunId: string | null;
  }> = [];
  for (const [subTaskId, list] of bySubTask) {
    const actions = list.map((row) => row.action);
    if (!hasOpenStartedSessionFromActions(actions)) continue;
    const lastStarted = [...list]
      .reverse()
      .find((row) => row.action === "started");
    if (!lastStarted) continue;
    open.push({
      id: lastStarted.id,
      subTaskId,
      chainRunId: lastStarted.chainRunId,
    });
  }
  return open;
}

export async function joinLiveChain(
  colaboratorId: string,
  subTaskId: string,
  db: Db = getDb(),
): Promise<{ chainRunId: string }> {
  const [candidate] = await db
    .select()
    .from(subTasks)
    .where(eq(subTasks.id, subTaskId))
    .limit(1);
  if (!candidate) throw new Error("notFound");

  const settings = await getKioskSettings(db);
  const maxIntervalSeconds = normalizeKioskLiveChainIntervalSeconds(
    Number(
      settings?.maxSimultaneousSubtaskIntervalSeconds ??
        DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
    ),
  );

  const openRows = await findOpenStartedRowsForColaborator(colaboratorId, db);
  const siblings = await listSubTasksWithRelationsForTask(candidate.taskId, db);
  const siblingIds = new Set(siblings.map((row) => row.id));
  const openOnTask = openRows.filter((row) => siblingIds.has(row.subTaskId));
  if (openOnTask.length === 0) throw new Error("forbidden");

  const items = siblings.map(toChainItem);
  const chains = resolveChains(items);
  const byId = new Map(items.map((item) => [item.documentId, item]));
  const liveIds = new Set<string>();
  for (const open of openOnTask) {
    const chain = findChainContaining(chains, open.subTaskId);
    if (chain && chain.memberIds.length > 1) {
      for (const member of remainingExecutableMembers(chain, byId)) {
        liveIds.add(member.documentId);
      }
    } else {
      liveIds.add(open.subTaskId);
    }
  }

  const liveMembers = siblings
    .filter((row) => liveIds.has(row.id))
    .map((row) => toLiveChainMember(row, candidate.taskId));
  const assignedIds = new Set(
    siblings
      .filter((row) => row.assignedToIds.includes(colaboratorId))
      .map((row) => row.id),
  );
  const next = nextJoinableSibling({
    liveMembers,
    siblings: siblings.map((row) => toLiveChainMember(row, candidate.taskId)),
    viewerAssignedIds: assignedIds,
    maxIntervalSeconds,
  });
  if (!next || next.documentId !== subTaskId) throw new Error("forbidden");

  const chainRunId = openOnTask[0]?.chainRunId ?? randomUUID();
  await db.transaction(async (tx) => {
    if (!openOnTask[0]?.chainRunId) {
      await tx
        .update(activities)
        .set({ chainRunId })
        .where(eq(activities.id, openOnTask[0]!.id));
    }
    await updateSubTaskLinkedToPrevious(subTaskId, true, tx as unknown as Db);
  });

  return { chainRunId };
}
