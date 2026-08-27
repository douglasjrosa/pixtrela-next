/**
 * Potential currency a sub-task can generate when completed.
 * Matches Strapi pool size: expectedTime × currencyPerSecond.
 */
export function calculateSubtaskPayment(
  expectedTime: number,
  currencyPerSecond: number,
): number {
  const seconds = Math.max(0, expectedTime);
  const rate = Math.max(0, currencyPerSecond);
  return seconds * rate;
}

const FULL_PERCENT = 100;

/**
 * Participation share of wall-clock work vs sub-task timeSpent, rounded up.
 */
export function calculateParticipationPercent(
  colaboratorDurationSec: number,
  subtaskTimeSpent: number,
): number {
  const duration = Math.max(0, colaboratorDurationSec);
  const spent = Math.max(0, subtaskTimeSpent);
  if (spent <= 0) return 0;
  return Math.ceil((duration / spent) * FULL_PERCENT);
}

export type ColaboratorEarningsInput = {
  sharingType: "qty" | "duration";
  colaboratorDurationSec: number;
  colaboratorQty: number;
  totalDurationSec: number;
  totalQty: number;
  expectedTime: number;
  currencyPerSecond: number;
  /**
   * Target pieces for qty sharing (`subTask.qty`, already scaled).
   * Falls back to `totalQty` when omitted (incomplete preview).
   */
  targetQty?: number;
};

/**
 * Collaborator earnings preview aligned with Strapi work-currency:
 * - duration: ceil share of expectedTime × rate by time spent
 * - qty: pieces × (expectedTime / targetQty) × rate (no ceil)
 */
export function calculateColaboratorEarnings(
  input: ColaboratorEarningsInput,
): number {
  const rate = Math.max(0, input.currencyPerSecond);
  const expected = Math.max(0, input.expectedTime);
  if (rate <= 0 || expected <= 0) return 0;

  if (input.sharingType === "qty") {
    const pieces = Math.max(0, Math.floor(Number(input.colaboratorQty) || 0));
    if (pieces <= 0) return 0;
    const target = Math.max(
      1,
      Math.floor(Number(input.targetQty ?? input.totalQty) || 0) || 1,
    );
    return pieces * (expected / target) * rate;
  }

  const pool = expected * rate;
  const totalDuration = Math.max(0, input.totalDurationSec);
  if (totalDuration <= 0) return 0;
  const duration = Math.max(0, input.colaboratorDurationSec);
  return Math.ceil((duration / totalDuration) * pool);
}
