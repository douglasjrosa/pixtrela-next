import { and, asc, eq, gte, inArray, isNull, lt } from "drizzle-orm";

import {
  activities,
  balances,
  currencies,
  currencyForSubtasks,
  subTasks,
} from "@/drizzle/schema";
import { ACTIVE_ACTIVITY } from "@/lib/domain/active-activity";
import { firstDayOfMonth } from "@/lib/domain/balance";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { getDb } from "@/lib/db/client";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

import {
  aggregateDailyIncomeFromActivities,
  buildPreviousMonthsSummary,
  previousMonthDates,
  type ActivityIncomeRow,
} from "./dashboard-insights";
import type { ColaboratorInsightsData } from "./types";

const EMPTY_INSIGHTS: ColaboratorInsightsData = {
  colaboratorDocumentId: "",
  month: "",
  dailyIncomeByCurrency: [],
  previousMonthsByCurrency: [],
};

function monthUtcBounds(reference: Date): { start: Date; end: Date } {
  const year = reference.getUTCFullYear();
  const monthIndex = reference.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0)),
  };
}

async function loadColaboratorInsightsImpl(
  colaboratorDocumentId: string,
  referenceMonth: Date = new Date(),
): Promise<ColaboratorInsightsData> {
  const db = getDb();
  const month = firstDayOfMonth(referenceMonth);
  const { start, end } = monthUtcBounds(referenceMonth);

  const currencyRows = await db
    .select({
      id: currencies.id,
      name: currencies.name,
      title: currencies.title,
      pluralTitle: currencies.pluralTitle,
      currencyPerSecond: currencies.currencyPerSecond,
    })
    .from(currencies)
    .orderBy(asc(currencies.name));

  const currencyRates = currencyRows.map((row, index) => ({
    id: index + 1,
    currencyPerSecond: Number(row.currencyPerSecond),
  }));

  const pluralTitleBySyntheticId = new Map(
    currencyRows.map((row, index) => [
      index + 1,
      resolveCurrencyPluralTitle(row),
    ]),
  );

  const [paymentSetting] = await db
    .select()
    .from(currencyForSubtasks)
    .where(isNull(currencyForSubtasks.validUntil))
    .limit(1);
  const paymentCurrencyIndex = paymentSetting
    ? currencyRows.findIndex((row) => row.id === paymentSetting.currencyId)
    : 0;
  const defaultCurrencyId =
    paymentCurrencyIndex >= 0 ? paymentCurrencyIndex + 1 : 1;

  const activityRows = await db
    .select({
      timestamp: activities.timestamp,
      action: activities.action,
      currencyAwarded: activities.currencyAwarded,
      expectedTime: subTasks.expectedTime,
      status: subTasks.status,
    })
    .from(activities)
    .innerJoin(subTasks, eq(activities.subTaskId, subTasks.id))
    .where(
      and(
        ACTIVE_ACTIVITY,
        eq(activities.colaboratorId, colaboratorDocumentId),
        gte(activities.timestamp, start),
        lt(activities.timestamp, end),
      ),
    )
    .orderBy(asc(activities.timestamp));

  const incomeActivities: ActivityIncomeRow[] = activityRows.map((row) => ({
    timestamp: row.timestamp.toISOString(),
    action: row.action,
    subTaskStatus: String(row.status ?? ""),
    expectedTime: Number(row.expectedTime ?? 0),
    currencyAwarded: Number(row.currencyAwarded ?? 0),
    currencyId: defaultCurrencyId,
  }));

  const previousMonthKeys = previousMonthDates(referenceMonth, 3);
  const balanceRows = previousMonthKeys.length === 0
    ? []
    : await db
        .select({
          date: balances.date,
          currencyPluralTitle: balances.currencyPluralTitle,
          totalIncome: balances.totalIncome,
          totalOutcome: balances.totalOutcome,
        })
        .from(balances)
        .where(
          and(
            eq(balances.userId, colaboratorDocumentId),
            inArray(balances.date, previousMonthKeys),
          ),
        );

  const monthBalances = balanceRows.map((row) => {
    let currencyId = 0;
    for (const [id, plural] of pluralTitleBySyntheticId.entries()) {
      if (plural === row.currencyPluralTitle) {
        currencyId = id;
        break;
      }
    }
    return {
      month: row.date,
      currencyId,
      totalIncome: Number(row.totalIncome),
      totalOutcome: Number(row.totalOutcome),
    };
  });

  return {
    colaboratorDocumentId,
    month,
    dailyIncomeByCurrency: aggregateDailyIncomeFromActivities(
      incomeActivities,
      currencyRates,
      referenceMonth,
    ),
    previousMonthsByCurrency: buildPreviousMonthsSummary(
      monthBalances,
      currencyRates.map((row) => ({ id: row.id })),
      referenceMonth,
      3,
    ),
  };
}

export async function loadColaboratorInsights(
  documentId: string,
): Promise<ColaboratorInsightsData> {
  if (!documentId) return EMPTY_INSIGHTS;

  try {
    return await loadColaboratorInsightsImpl(documentId);
  } catch (error) {
    rethrowIfNavigationError(error);
    return { ...EMPTY_INSIGHTS, colaboratorDocumentId: documentId };
  }
}
