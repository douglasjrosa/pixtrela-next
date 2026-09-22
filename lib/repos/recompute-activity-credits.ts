import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { activities, subTasks, tasks } from "@/drizzle/schema";
import { ACTIVE_ACTIVITY } from "@/lib/domain/active-activity";
import {
  calculateDurationCurrencyCredits,
  calculateQtySessionCurrency,
  shouldCreditDurationCurrency,
} from "@/lib/domain/work-currency";
import {
  listTimeSpentByColaborator,
  type ActivityTimeRow,
} from "@/lib/business/task-time-spent";
import type { Db } from "@/lib/db/client";
import { applyActivityIncomeDelta } from "@/lib/repos/activity-credits";
import { cascadeMonthlyBalances } from "@/lib/repos/balances";
import { reallocateChainRunForReplay } from "@/lib/repos/kiosk-chains";
import { resolvePaymentCurrencyAt } from "@/lib/repos/payment-currency";

export type ActivityCreditSnapshot = {
  activityId: string;
  colaboratorId: string;
  timestamp: Date;
  amount: number;
};

export type AwardAdjustment = {
  colaboratorId: string;
  timestamp: Date;
  delta: number;
};

export function listAwardAdjustments(
  previous: ActivityCreditSnapshot[],
  next: ActivityCreditSnapshot[],
): AwardAdjustment[] {
  const adjustments: AwardAdjustment[] = [];
  for (const row of previous) {
    if (row.amount === 0) continue;
    adjustments.push({
      colaboratorId: row.colaboratorId,
      timestamp: row.timestamp,
      delta: -row.amount,
    });
  }
  for (const row of next) {
    if (row.amount === 0) continue;
    adjustments.push({
      colaboratorId: row.colaboratorId,
      timestamp: row.timestamp,
      delta: row.amount,
    });
  }
  return adjustments;
}

export function earliestCascadeTargets(
  rows: Array<{
    colaboratorId: string;
    timestamp: Date;
    currencyPluralTitle: string;
  }>,
): Array<{ userId: string; currencyPluralTitle: string; from: Date }> {
  const cascadeKeys = new Map<
    string,
    { userId: string; currencyPluralTitle: string; from: Date }
  >();
  for (const row of rows) {
    const key = `${row.colaboratorId}:${row.currencyPluralTitle}`;
    const existing = cascadeKeys.get(key);
    if (!existing || row.timestamp < existing.from) {
      cascadeKeys.set(key, {
        userId: row.colaboratorId,
        currencyPluralTitle: row.currencyPluralTitle,
        from: row.timestamp,
      });
    }
  }
  return [...cascadeKeys.values()];
}

type AwardScope = {
  subTaskIds: string[];
  chainRunIds: string[];
};

function uniqueIds(ids: readonly (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function scopeWhere(scope: AwardScope) {
  const parts = [];
  if (scope.subTaskIds.length > 0) {
    parts.push(inArray(activities.subTaskId, scope.subTaskIds));
  }
  if (scope.chainRunIds.length > 0) {
    parts.push(inArray(activities.chainRunId, scope.chainRunIds));
  }
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return or(...parts);
}

export async function loadActiveCreditSnapshots(
  scope: {
    subTaskIds?: Array<string | null | undefined>;
    chainRunIds?: Array<string | null | undefined>;
  },
  db: Db,
): Promise<ActivityCreditSnapshot[]> {
  const whereScope = scopeWhere({
    subTaskIds: uniqueIds(scope.subTaskIds ?? []),
    chainRunIds: uniqueIds(scope.chainRunIds ?? []),
  });
  if (!whereScope) return [];
  const rows = await db
    .select({
      activityId: activities.id,
      colaboratorId: activities.colaboratorId,
      timestamp: activities.timestamp,
      amount: activities.currencyAwarded,
    })
    .from(activities)
    .where(and(ACTIVE_ACTIVITY, whereScope));
  return rows.map((row) => ({
    activityId: row.activityId,
    colaboratorId: row.colaboratorId,
    timestamp: row.timestamp,
    amount: row.amount,
  }));
}

async function recomputeIsolatedSubtask(
  subTaskId: string,
  db: Db,
): Promise<ActivityCreditSnapshot[]> {
  const [sub] = await db
    .select()
    .from(subTasks)
    .where(eq(subTasks.id, subTaskId))
    .limit(1);
  if (!sub) return [];
  const [task] = await db
    .select({ qty: tasks.qty })
    .from(tasks)
    .where(eq(tasks.id, sub.taskId))
    .limit(1);
  if (!task) return [];

  const rows = await db
    .select({
      id: activities.id,
      colaboratorId: activities.colaboratorId,
      action: activities.action,
      timestamp: activities.timestamp,
      qty: activities.qty,
    })
    .from(activities)
    .where(
      and(
        ACTIVE_ACTIVITY,
        eq(activities.subTaskId, subTaskId),
        isNull(activities.chainRunId),
      ),
    );

  const next: ActivityCreditSnapshot[] = [];

  if (sub.sharingType === "qty") {
    for (const row of rows) {
      if (row.action !== "stoped") continue;
      const currency = await resolvePaymentCurrencyAt(row.timestamp, db);
      const amount = calculateQtySessionCurrency(
        {
          expectedTime: sub.expectedTime,
          qty: sub.qty,
          taskQty: task.qty,
          sharingType: "qty",
        },
        { sessionQty: row.qty },
        { currencyPerSecond: currency?.currencyPerSecond ?? 0 },
      );
      await db
        .update(activities)
        .set({ currencyAwarded: amount })
        .where(eq(activities.id, row.id));
      next.push({
        activityId: row.id,
        colaboratorId: row.colaboratorId,
        timestamp: row.timestamp,
        amount,
      });
    }
    return next;
  }

  const lastStop = [...rows]
    .filter((row) => row.action === "stoped")
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .at(-1);
  const currency = lastStop
    ? await resolvePaymentCurrencyAt(lastStop.timestamp, db)
    : null;
  const timeRows: ActivityTimeRow[] = rows.map((row) => ({
    colaboratorId: row.colaboratorId,
    action: row.action,
    timestamp: row.timestamp,
  }));
  const shouldCredit =
    Boolean(currency) &&
    shouldCreditDurationCurrency({
      action: "stoped",
      subTaskStatus: sub.status,
    });
  const credits = shouldCredit
    ? calculateDurationCurrencyCredits(
        {
          expectedTime: sub.expectedTime,
          qty: sub.qty,
          taskQty: task.qty,
          sharingType: "duration",
        },
        listTimeSpentByColaborator(timeRows, lastStop!.timestamp).map((row) => ({
          colaboratorId: row.colaboratorId,
          timeSpentSeconds: row.timeSpentSeconds,
        })),
        { currencyPerSecond: currency!.currencyPerSecond },
      )
    : [];
  const byColaborator = new Map(
    credits.map((row) => [row.colaboratorId, row.amount]),
  );
  const lastStopByColaborator = new Map<string, string>();
  for (const row of [...rows].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  )) {
    if (row.action !== "stoped") continue;
    lastStopByColaborator.set(row.colaboratorId, row.id);
  }

  for (const row of rows) {
    if (row.action !== "stoped") continue;
    const isLast = lastStopByColaborator.get(row.colaboratorId) === row.id;
    const amount = isLast ? (byColaborator.get(row.colaboratorId) ?? 0) : 0;
    await db
      .update(activities)
      .set({ currencyAwarded: amount })
      .where(eq(activities.id, row.id));
    next.push({
      activityId: row.id,
      colaboratorId: row.colaboratorId,
      timestamp: row.timestamp,
      amount,
    });
  }
  return next;
}

async function applyAwardDiffs(
  previous: ActivityCreditSnapshot[],
  next: ActivityCreditSnapshot[],
  db: Db,
): Promise<void> {
  const adjustments = listAwardAdjustments(previous, next);
  const cascadeRows: Array<{
    colaboratorId: string;
    timestamp: Date;
    currencyPluralTitle: string;
  }> = [];

  for (const row of adjustments) {
    const currency = await resolvePaymentCurrencyAt(row.timestamp, db);
    if (!currency) continue;
    await applyActivityIncomeDelta(
      {
        colaboratorId: row.colaboratorId,
        timestamp: row.timestamp,
        delta: row.delta,
        currencyPluralTitle: currency.currencyPluralTitle,
      },
      db,
    );
    cascadeRows.push({
      colaboratorId: row.colaboratorId,
      timestamp: row.timestamp,
      currencyPluralTitle: currency.currencyPluralTitle,
    });
  }
  for (const target of earliestCascadeTargets(cascadeRows)) {
    await cascadeMonthlyBalances(target, db);
  }
}

async function recalculateAwards(
  scope: AwardScope,
  db: Db,
): Promise<ActivityCreditSnapshot[]> {
  const next: ActivityCreditSnapshot[] = [];
  for (const chainRunId of scope.chainRunIds) {
    await reallocateChainRunForReplay(chainRunId, db);
  }
  for (const subTaskId of scope.subTaskIds) {
    next.push(...(await recomputeIsolatedSubtask(subTaskId, db)));
  }
  if (scope.chainRunIds.length > 0) {
    next.push(
      ...(await loadActiveCreditSnapshots(
        { subTaskIds: [], chainRunIds: scope.chainRunIds },
        db,
      )),
    );
  }
  return next;
}

export async function recomputeActivityCreditsAfterAdminChange(
  input: {
    subTaskIds?: Array<string | null | undefined>;
    chainRunIds?: Array<string | null | undefined>;
    previous: ActivityCreditSnapshot[];
  },
  db: Db,
): Promise<void> {
  const resolved: AwardScope = {
    subTaskIds: uniqueIds(input.subTaskIds ?? []),
    chainRunIds: uniqueIds(input.chainRunIds ?? []),
  };
  const previousById = new Map<string, ActivityCreditSnapshot>();
  for (const row of input.previous) {
    previousById.set(row.activityId, row);
  }
  const next = await recalculateAwards(resolved, db);
  await applyAwardDiffs([...previousById.values()], next, db);
}
