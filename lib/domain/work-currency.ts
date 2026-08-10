/**
 * Pure work-currency rules for SubTask completion payments (canonical).
 * Ported from strapi/src/business/work-currency.ts — keep in sync.
 */

export interface WorkCurrencyRate {
  currencyPerSecond: number;
}

export type WorkSharingType = "qty" | "duration";

export interface WorkSubTaskContext {
  expectedTime: number;
  qty: number;
  taskQty: number;
  sharingType: WorkSharingType;
}

export interface QtyCurrencySession {
  sessionQty: number;
}

export interface DurationParticipation {
  colaboratorId: string;
  timeSpentSeconds: number;
}

export interface CurrencyCredit {
  colaboratorId: string;
  amount: number;
}

export function scaleExpectedTimeByTaskQty(
  baseExpectedTime: number,
  taskQty: number,
): number {
  const base = Math.max(0, Number(baseExpectedTime) || 0);
  const qty = Math.max(1, Math.floor(Number(taskQty) || 0) || 1);
  return base * qty;
}

export function rescaleExpectedTimeForTaskQtyChange(
  currentExpectedTime: number,
  previousTaskQty: number,
  nextTaskQty: number,
): number {
  const previousQty = Math.max(1, Math.floor(Number(previousTaskQty) || 0) || 1);
  const nextQty = Math.max(1, Math.floor(Number(nextTaskQty) || 0) || 1);
  const current = Math.max(0, Number(currentExpectedTime) || 0);
  if (previousQty === nextQty) return current;
  return Math.round((current / previousQty) * nextQty);
}

export function resolveSubTaskTargetQty(
  subTaskQty: number,
  taskQty: number,
): number {
  const pieces = Math.max(1, Math.floor(Number(subTaskQty) || 0) || 1);
  const tasks = Math.max(1, Math.floor(Number(taskQty) || 0) || 1);
  return pieces * tasks;
}

export function resolveSecondsPerPiece(
  expectedTime: number,
  subTaskQty: number,
  taskQty: number,
): number {
  const targetQty = resolveSubTaskTargetQty(subTaskQty, taskQty);
  const expected = Math.max(0, Number(expectedTime) || 0);
  if (targetQty <= 0) return 0;
  return expected / targetQty;
}

export function calculateQtySessionCurrency(
  context: WorkSubTaskContext,
  session: QtyCurrencySession,
  currency: WorkCurrencyRate,
): number {
  const rate = Math.max(0, currency.currencyPerSecond ?? 0);
  const pieces = Math.max(0, Math.floor(Number(session.sessionQty) || 0));
  if (rate <= 0 || pieces <= 0) return 0;
  if (context.sharingType !== "qty") return 0;

  const secondsPerPiece = resolveSecondsPerPiece(
    context.expectedTime,
    context.qty,
    context.taskQty,
  );
  return pieces * secondsPerPiece * rate;
}

export function calculateDurationCurrencyCredits(
  context: WorkSubTaskContext,
  participations: DurationParticipation[],
  currency: WorkCurrencyRate,
): CurrencyCredit[] {
  const rate = Math.max(0, currency.currencyPerSecond ?? 0);
  const poolSeconds = Math.max(0, Number(context.expectedTime) || 0);
  if (context.sharingType !== "duration" || rate <= 0 || poolSeconds <= 0) {
    return [];
  }

  const cleaned = participations
    .map((row) => ({
      colaboratorId: row.colaboratorId,
      timeSpentSeconds: Math.max(0, Number(row.timeSpentSeconds) || 0),
    }))
    .filter((row) => row.timeSpentSeconds > 0);

  const totalSpent = cleaned.reduce(
    (sum, row) => sum + row.timeSpentSeconds,
    0,
  );
  if (totalSpent <= 0) return [];

  const poolAmount = poolSeconds * rate;

  return cleaned.map((row) => ({
    colaboratorId: row.colaboratorId,
    amount: Math.ceil((row.timeSpentSeconds / totalSpent) * poolAmount),
  }));
}

/** Simple duration-seconds × rate helper for incremental stop credits. */
export function calculateDurationSecondsCurrency(input: {
  durationSeconds: number;
  currencyPerSecond: number;
}): number {
  const seconds = Math.max(0, input.durationSeconds);
  const rate = Math.max(0, input.currencyPerSecond);
  return Math.floor(seconds * rate);
}

export interface CompletingActivity {
  action: "started" | "stoped";
  subTaskStatus: string;
}

export function shouldCreditDurationCurrency(
  activity: CompletingActivity,
): boolean {
  return activity.action === "stoped" && activity.subTaskStatus === "finished";
}

export function shouldCreditCurrency(activity: CompletingActivity): boolean {
  return shouldCreditDurationCurrency(activity);
}
