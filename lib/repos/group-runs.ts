import { and, eq, inArray, isNull } from "drizzle-orm";

import {
  activities,
  chainRuns,
  openSessions,
  subTasks,
  tasks,
} from "@/drizzle/schema";
import {
  CHAIN_STOP_ANSWERS_REQUIRED,
  resolveGroupLeave,
} from "@/lib/business/chain-stop-policy";
import { formatQueueGroupLabel } from "@/lib/business/group-link";
import {
  groupCapacity,
  planGroupCloseActivities,
  type GroupPresence,
} from "@/lib/business/group-session";
import {
  allocateChainTimeline,
  type ChainStopAnswer,
} from "@/lib/business/subtask-chain-allocation";
import { getDb, type Db } from "@/lib/db/client";
import {
  calculateDurationCurrencyCredits,
  calculateQtySessionCurrency,
  toActivityCurrencyAward,
} from "@/lib/domain/work-currency";
import {
  adjustBalanceIncome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import { resolvePaymentCurrencyAt } from "@/lib/repos/payment-currency";
import { scheduleBoardInvalidate } from "@/lib/realtime/publish-board-invalidate";
import { scheduleTaskSubTaskSync } from "@/lib/repos/schedule-task-sync";
import type { SubTaskWithAssignees } from "@/lib/repos/tasks";

const OPEN_STATUS = "open";
const PRODUCING_STATUS = "producing";
const FINISHED_STATUS = "finished";

export type OpenSessionLiveRow = {
  subTaskId: string;
  userId: string;
  startedAt: Date;
};

export type StaffOpenSessionLabel = {
  colaboratorId: string;
  action: "started";
  timestamp: Date;
  subTaskName: string;
  taskName: string;
  taskQty: number;
  taskCrmItemKey: string | null;
  taskDeliveryDate: string | null;
  groupOtherCount: number;
};

function headAssignees(
  headId: string,
  siblings: readonly SubTaskWithAssignees[],
): string[] {
  return siblings.find((row) => row.id === headId)?.assignedToIds ?? [];
}

export async function openOrJoinGroupRun(input: {
  colaboratorId: string;
  taskId: string;
  headId: string;
  memberIds: readonly string[];
  siblings: readonly SubTaskWithAssignees[];
  timestamp: Date;
  db?: Db;
}): Promise<{ chainRunId: string }> {
  const db = input.db ?? getDb();
  if (!headAssignees(input.headId, input.siblings).includes(input.colaboratorId)) {
    throw new Error("notAssigned");
  }
  const capacity = groupCapacity(
    input.memberIds.map(
      (id) => input.siblings.find((row) => row.id === id)?.maxSameTimeWorkers ?? 1,
    ),
  );

  const [existing] = await db
    .select()
    .from(chainRuns)
    .where(
      and(eq(chainRuns.headSubTaskId, input.headId), eq(chainRuns.status, OPEN_STATUS)),
    )
    .limit(1);

  if (existing) {
    await assertJoinCapacity(existing.id, existing.capacity, input.colaboratorId, db);
    await insertMemberSessions({
      chainRunId: existing.id,
      memberIds: input.memberIds,
      userId: input.colaboratorId,
      joinedAt: input.timestamp,
      db,
    });
    await markMembersProducing(input.memberIds, input.taskId, input.timestamp, db);
    return { chainRunId: existing.id };
  }

  const [created] = await db
    .insert(chainRuns)
    .values({
      taskId: input.taskId,
      headSubTaskId: input.headId,
      status: OPEN_STATUS,
      startedAt: input.timestamp,
      capacity,
    })
    .returning({ id: chainRuns.id });
  if (!created) throw new Error("notFound");

  await insertMemberSessions({
    chainRunId: created.id,
    memberIds: input.memberIds,
    userId: input.colaboratorId,
    joinedAt: input.timestamp,
    db,
  });
  await markMembersProducing(input.memberIds, input.taskId, input.timestamp, db);
  return { chainRunId: created.id };
}

async function assertJoinCapacity(
  chainRunId: string,
  capacity: number,
  userId: string,
  db: Db,
): Promise<void> {
  const rows = await db
    .select({ userId: openSessions.userId })
    .from(openSessions)
    .where(and(eq(openSessions.chainRunId, chainRunId), isNull(openSessions.leftAt)));
  const active = new Set(rows.map((row) => row.userId));
  if (active.has(userId)) throw new Error("alreadyActive");
  if (active.size >= capacity) throw new Error("atWorkerCapacity");
}

async function insertMemberSessions(input: {
  chainRunId: string;
  memberIds: readonly string[];
  userId: string;
  joinedAt: Date;
  db: Db;
}): Promise<void> {
  await input.db.insert(openSessions).values(
    input.memberIds.map((subTaskId) => ({
      subTaskId,
      userId: input.userId,
      joinedAt: input.joinedAt,
      chainRunId: input.chainRunId,
    })),
  );
}

async function markMembersProducing(
  memberIds: readonly string[],
  taskId: string,
  timestamp: Date,
  db: Db,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(subTasks)
      .set({ status: PRODUCING_STATUS, updatedAt: timestamp })
      .where(inArray(subTasks.id, [...memberIds]));
  });
  await scheduleTaskSubTaskSync(taskId, timestamp);
}

export async function findOpenGroupRunForMembers(
  memberIds: readonly string[],
  db: Db = getDb(),
): Promise<{
  chainRunId: string;
  principalId: string;
  runStartedAt: Date;
} | null> {
  if (memberIds.length === 0) return null;
  const [session] = await db
    .select({
      chainRunId: openSessions.chainRunId,
      userId: openSessions.userId,
    })
    .from(openSessions)
    .innerJoin(chainRuns, eq(chainRuns.id, openSessions.chainRunId))
    .where(
      and(
        eq(chainRuns.status, OPEN_STATUS),
        isNull(openSessions.leftAt),
        inArray(openSessions.subTaskId, [...memberIds]),
      ),
    )
    .limit(1);
  if (!session?.chainRunId) return null;
  const [run] = await db
    .select({ startedAt: chainRuns.startedAt })
    .from(chainRuns)
    .where(eq(chainRuns.id, session.chainRunId))
    .limit(1);
  if (!run) return null;
  return {
    chainRunId: session.chainRunId,
    principalId: session.userId,
    runStartedAt: run.startedAt,
  };
}

export async function listOpenGroupRunsByHead(
  headIds: readonly string[],
  db: Db = getDb(),
): Promise<
  Map<string, { chainRunId: string; principalId: string; runStartedAt: Date }>
> {
  if (headIds.length === 0) return new Map();
  const runs = await db
    .select()
    .from(chainRuns)
    .where(
      and(eq(chainRuns.status, OPEN_STATUS), inArray(chainRuns.headSubTaskId, [...headIds])),
    );
  const result = new Map<
    string,
    { chainRunId: string; principalId: string; runStartedAt: Date }
  >();
  for (const run of runs) {
    const [first] = await db
      .select({ userId: openSessions.userId })
      .from(openSessions)
      .where(eq(openSessions.chainRunId, run.id))
      .limit(1);
    result.set(run.headSubTaskId, {
      chainRunId: run.id,
      principalId: first?.userId ?? "",
      runStartedAt: run.startedAt,
    });
  }
  return result;
}

export async function listOpenSessionLive(
  subTaskIds: readonly string[],
  db: Db = getDb(),
): Promise<OpenSessionLiveRow[]> {
  if (subTaskIds.length === 0) return [];
  const rows = await db
    .select({
      subTaskId: openSessions.subTaskId,
      userId: openSessions.userId,
      joinedAt: openSessions.joinedAt,
      chainRunId: openSessions.chainRunId,
    })
    .from(openSessions)
    .where(
      and(inArray(openSessions.subTaskId, [...subTaskIds]), isNull(openSessions.leftAt)),
    );
  const runIds = [
    ...new Set(rows.map((row) => row.chainRunId).filter((id): id is string => Boolean(id))),
  ];
  const startedByRun = new Map<string, Date>();
  if (runIds.length > 0) {
    const runs = await db
      .select({ id: chainRuns.id, startedAt: chainRuns.startedAt })
      .from(chainRuns)
      .where(inArray(chainRuns.id, runIds));
    for (const run of runs) startedByRun.set(run.id, run.startedAt);
  }
  return rows.map((row) => ({
    subTaskId: row.subTaskId,
    userId: row.userId,
    startedAt: (row.chainRunId && startedByRun.get(row.chainRunId)) || row.joinedAt,
  }));
}

export async function listOpenUserIdsForSubTask(
  subTaskId: string,
  db: Db,
): Promise<string[]> {
  const rows = await db
    .select({ userId: openSessions.userId })
    .from(openSessions)
    .where(
      and(eq(openSessions.subTaskId, subTaskId), isNull(openSessions.leftAt)),
    );
  return [...new Set(rows.map((row) => row.userId))];
}

export async function listOpenSubTaskIdsForUser(
  userId: string,
  db: Db,
): Promise<string[]> {
  const rows = await db
    .select({ subTaskId: openSessions.subTaskId })
    .from(openSessions)
    .where(and(eq(openSessions.userId, userId), isNull(openSessions.leftAt)));
  return [...new Set(rows.map((row) => row.subTaskId))];
}

export async function findIsolatedOpenSession(
  subTaskId: string,
  userId: string,
  db: Db,
): Promise<{ joinedAt: Date } | null> {
  const [row] = await db
    .select({ joinedAt: openSessions.joinedAt })
    .from(openSessions)
    .where(
      and(
        eq(openSessions.subTaskId, subTaskId),
        eq(openSessions.userId, userId),
        isNull(openSessions.leftAt),
        isNull(openSessions.chainRunId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function ensureChainRunForOpenSessions(input: {
  colaboratorId: string;
  taskId: string;
  headSubTaskId: string;
  openSubTaskIds: readonly string[];
  capacity: number;
  timestamp: Date;
  db: Db;
}): Promise<string> {
  if (input.openSubTaskIds.length === 0) throw new Error("noOpenSession");
  const rows = await input.db
    .select({
      id: openSessions.id,
      chainRunId: openSessions.chainRunId,
    })
    .from(openSessions)
    .where(
      and(
        eq(openSessions.userId, input.colaboratorId),
        isNull(openSessions.leftAt),
        inArray(openSessions.subTaskId, [...input.openSubTaskIds]),
      ),
    );
  const existing = rows.find((row) => row.chainRunId)?.chainRunId;
  if (existing) return existing;

  const [created] = await input.db
    .insert(chainRuns)
    .values({
      taskId: input.taskId,
      headSubTaskId: input.headSubTaskId,
      status: OPEN_STATUS,
      startedAt: input.timestamp,
      capacity: Math.max(1, input.capacity),
    })
    .returning({ id: chainRuns.id });
  if (!created) throw new Error("notFound");
  if (rows.length > 0) {
    await input.db
      .update(openSessions)
      .set({ chainRunId: created.id })
      .where(
        inArray(
          openSessions.id,
          rows.map((row) => row.id),
        ),
      );
  }
  return created.id;
}

export async function insertIsolatedOpenSession(
  subTaskId: string,
  userId: string,
  joinedAt: Date,
  db: Db,
): Promise<void> {
  await db.insert(openSessions).values({ subTaskId, userId, joinedAt });
}

export async function deleteOpenSessionsForUser(
  subTaskId: string,
  userId: string,
  db: Db,
): Promise<void> {
  await db
    .delete(openSessions)
    .where(
      and(
        eq(openSessions.subTaskId, subTaskId),
        eq(openSessions.userId, userId),
        isNull(openSessions.chainRunId),
      ),
    );
}

export async function findOpenChainRunRow(
  chainRunId: string,
  db: Db,
): Promise<{ id: string; taskId: string; startedAt: Date } | null> {
  const [run] = await db
    .select({
      id: chainRuns.id,
      taskId: chainRuns.taskId,
      startedAt: chainRuns.startedAt,
      status: chainRuns.status,
    })
    .from(chainRuns)
    .where(eq(chainRuns.id, chainRunId))
    .limit(1);
  if (!run || run.status !== OPEN_STATUS) return null;
  return run;
}

export async function leaveGroupRun(input: {
  chainRunId: string;
  colaboratorId: string;
  answers: readonly ChainStopAnswer[];
  timestamp: Date;
  db?: Db;
}): Promise<void> {
  const db = input.db ?? getDb();
  const run = await findOpenChainRunRow(input.chainRunId, db);
  if (!run) throw new Error("noOpenSession");

  const openRows = await db
    .select({ userId: openSessions.userId })
    .from(openSessions)
    .where(
      and(
        eq(openSessions.chainRunId, input.chainRunId),
        isNull(openSessions.leftAt),
      ),
    );
  const openUserIds = [...new Set(openRows.map((row) => row.userId))];
  const decision = resolveGroupLeave({
    openUserIds,
    colaboratorId: input.colaboratorId,
    answerCount: input.answers.length,
  });
  if (decision === "answersRequired") {
    throw new Error(CHAIN_STOP_ANSWERS_REQUIRED);
  }

  await db
    .update(openSessions)
    .set({ leftAt: input.timestamp })
    .where(
      and(
        eq(openSessions.chainRunId, input.chainRunId),
        eq(openSessions.userId, input.colaboratorId),
        isNull(openSessions.leftAt),
      ),
    );

  const stillOpen = await db
    .select({ userId: openSessions.userId })
    .from(openSessions)
    .where(
      and(eq(openSessions.chainRunId, input.chainRunId), isNull(openSessions.leftAt)),
    );
  if (stillOpen.length > 0) return;
  if (isDurationPauseExit(input.answers)) {
    await pauseDurationGroupRun(run, input.timestamp, db);
    return;
  }
  await closeGroupRun(
    run,
    input.answers,
    input.timestamp,
    input.colaboratorId,
    db,
  );
}

function isDurationPauseExit(answers: readonly ChainStopAnswer[]): boolean {
  if (answers.length === 0) return false;
  return answers.every((answer) => answer.completed === false);
}

async function pauseDurationGroupRun(
  run: { id: string; taskId: string },
  timestamp: Date,
  db: Db,
): Promise<void> {
  const sessions = await db
    .select({ subTaskId: openSessions.subTaskId })
    .from(openSessions)
    .where(eq(openSessions.chainRunId, run.id));
  const memberIds = [...new Set(sessions.map((row) => row.subTaskId))];
  await db.transaction(async (tx) => {
    if (memberIds.length > 0) {
      await tx
        .update(subTasks)
        .set({ status: "waiting", updatedAt: timestamp })
        .where(inArray(subTasks.id, memberIds));
    }
    await tx.delete(openSessions).where(eq(openSessions.chainRunId, run.id));
    await tx.delete(chainRuns).where(eq(chainRuns.id, run.id));
  });
  await scheduleTaskSubTaskSync(run.taskId, timestamp);
}

async function closeGroupRun(
  run: { id: string; taskId: string; startedAt: Date },
  answers: readonly ChainStopAnswer[],
  endedAt: Date,
  closingUserId: string,
  db: Db,
): Promise<void> {
  const sessions = await db
    .select()
    .from(openSessions)
    .where(eq(openSessions.chainRunId, run.id));
  const memberIds = [...new Set(sessions.map((row) => row.subTaskId))];
  const members = memberIds.length
    ? await db.select().from(subTasks).where(inArray(subTasks.id, memberIds))
    : [];
  const ordered = [...members].sort((left, right) => left.index - right.index);
  const presences = presencesFromSessions(sessions, endedAt);
  const memberClocks = ordered.map((row) => ({
    documentId: row.id,
    expectedTime: row.expectedTime,
  }));
  const planned = planGroupCloseActivities({
    runStartedAt: run.startedAt,
    endedAt,
    members: memberClocks,
    presences,
  });
  const wallByMember = new Map(
    allocateChainTimeline({
      runStartedAt: run.startedAt,
      stopAt: endedAt,
      finishedThisRun: memberClocks,
    }).segments.map((segment) => [segment.documentId, segment.timeSpent]),
  );
  const currency = await resolvePaymentCurrencyAt(endedAt, db);
  const qtyByMember = new Map(
    answers.map((answer) => [answer.documentId, Math.max(0, answer.qty ?? 0)]),
  );

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as Db;
    for (const member of ordered) {
      const plannedShares = planned.filter((row) => row.subTaskId === member.id);
      const presence = sessions.find(
        (row) => row.subTaskId === member.id && row.userId === closingUserId,
      );
      const shares =
        plannedShares.length > 0
          ? plannedShares
          : presence
            ? [
                {
                  subTaskId: member.id,
                  colaboratorId: closingUserId,
                  startedAt: presence.joinedAt,
                  stoppedAt: endedAt,
                  timeSpentSeconds: 0,
                },
              ]
            : [];
      const credits =
        member.sharingType === "qty"
          ? []
          : calculateDurationCurrencyCredits(
              {
                expectedTime: member.expectedTime,
                qty: member.qty,
                taskQty: 1,
                sharingType: "duration",
              },
              shares.map((row) => ({
                colaboratorId: row.colaboratorId,
                timeSpentSeconds: row.timeSpentSeconds,
              })),
              { currencyPerSecond: Number(currency?.currencyPerSecond ?? 0) },
            );
      const creditByUser = new Map(
        credits.map((row) => [row.colaboratorId, row.amount]),
      );
      let qtyCreditAssigned = false;
      for (const share of shares) {
        const isQtyCloser =
          member.sharingType === "qty" &&
          share.colaboratorId === closingUserId &&
          !qtyCreditAssigned;
        const qty = isQtyCloser ? (qtyByMember.get(member.id) ?? 0) : 0;
        const qtyCredit =
          isQtyCloser && currency
            ? calculateQtySessionCurrency(
                {
                  expectedTime: member.expectedTime,
                  qty: member.qty,
                  taskQty: 1,
                  sharingType: "qty",
                },
                { sessionQty: qty },
                { currencyPerSecond: Number(currency.currencyPerSecond) },
              )
            : 0;
        if (isQtyCloser) qtyCreditAssigned = true;
        const awarded = toActivityCurrencyAward(
          member.sharingType === "qty"
            ? qtyCredit
            : (creditByUser.get(share.colaboratorId) ?? 0),
        );
        await tx.insert(activities).values([
          {
            subTaskId: member.id,
            colaboratorId: share.colaboratorId,
            action: "started",
            timestamp: share.startedAt,
            qty: 0,
            currencyAwarded: 0,
            chainRunId: run.id,
          },
          {
            subTaskId: member.id,
            colaboratorId: share.colaboratorId,
            action: "stoped",
            timestamp: share.stoppedAt,
            qty,
            currencyAwarded: awarded,
            chainRunId: run.id,
          },
        ]);
        if (awarded !== 0 && currency) {
          const balance = await getOrCreateMonthlyBalance(
            {
              userId: share.colaboratorId,
              currencyPluralTitle: currency.currencyPluralTitle,
              now: endedAt,
            },
            txDb,
          );
          await adjustBalanceIncome({ balanceId: balance.id, delta: awarded }, txDb);
        }
      }
      const wall = wallByMember.get(member.id) ?? 0;
      await tx
        .update(subTasks)
        .set({
          status: FINISHED_STATUS,
          timeSpent: member.timeSpent + wall,
          updatedAt: endedAt,
        })
        .where(eq(subTasks.id, member.id));
    }
    await tx.delete(openSessions).where(eq(openSessions.chainRunId, run.id));
    await tx.delete(chainRuns).where(eq(chainRuns.id, run.id));
  });
  await scheduleTaskSubTaskSync(run.taskId, endedAt);
  scheduleBoardInvalidate();
}

function presencesFromSessions(
  sessions: readonly {
    userId: string;
    joinedAt: Date;
    leftAt: Date | null;
  }[],
  endedAt: Date,
): GroupPresence[] {
  const byUser = new Map<string, GroupPresence>();
  for (const session of sessions) {
    const current = byUser.get(session.userId);
    const leftAt = session.leftAt ?? endedAt;
    if (!current) {
      byUser.set(session.userId, {
        userId: session.userId,
        joinedAt: session.joinedAt,
        leftAt,
      });
      continue;
    }
    if (session.joinedAt < current.joinedAt) current.joinedAt = session.joinedAt;
    if (leftAt > (current.leftAt ?? leftAt)) current.leftAt = leftAt;
  }
  return [...byUser.values()];
}

export async function listStaffOpenSessionLabels(
  colaboratorIds: readonly string[],
  db: Db = getDb(),
): Promise<Map<string, StaffOpenSessionLabel>> {
  if (colaboratorIds.length === 0) return new Map();
  const rows = await db
    .select({
      userId: openSessions.userId,
      subTaskId: openSessions.subTaskId,
      joinedAt: openSessions.joinedAt,
      chainRunId: openSessions.chainRunId,
      subTaskName: subTasks.name,
      taskName: tasks.name,
      taskQty: tasks.qty,
      taskCrmItemKey: tasks.crmItemKey,
      taskDeliveryDate: tasks.deliveryDate,
      headSubTaskId: chainRuns.headSubTaskId,
      runStartedAt: chainRuns.startedAt,
    })
    .from(openSessions)
    .innerJoin(subTasks, eq(openSessions.subTaskId, subTasks.id))
    .innerJoin(tasks, eq(subTasks.taskId, tasks.id))
    .leftJoin(chainRuns, eq(openSessions.chainRunId, chainRuns.id))
    .where(
      and(inArray(openSessions.userId, [...colaboratorIds]), isNull(openSessions.leftAt)),
    );

  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = grouped.get(row.userId) ?? [];
    list.push(row);
    grouped.set(row.userId, list);
  }

  const labels = new Map<string, StaffOpenSessionLabel>();
  for (const [userId, sessions] of grouped) {
    const chainSession = sessions.find((row) => row.chainRunId);
    const source = chainSession ?? sessions[0];
    if (!source) continue;
    const chainRows = chainSession
      ? sessions.filter((row) => row.chainRunId === chainSession.chainRunId)
      : [source];
    const head = chainRows.find((row) => row.subTaskId === row.headSubTaskId) ?? source;
    const otherCount = Math.max(0, new Set(chainRows.map((row) => row.subTaskId)).size - 1);
    labels.set(userId, {
      colaboratorId: userId,
      action: "started",
      timestamp: chainSession?.runStartedAt ?? source.joinedAt,
      subTaskName: formatQueueGroupLabel(head.subTaskName, otherCount),
      taskName: source.taskName,
      taskQty: source.taskQty,
      taskCrmItemKey: source.taskCrmItemKey,
      taskDeliveryDate: source.taskDeliveryDate,
      groupOtherCount: otherCount,
    });
  }
  return labels;
}
