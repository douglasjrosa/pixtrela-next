/**
 * Potential currency a sub-task can generate when completed.
 * Matches Strapi `calculateCurrencyAmount` pool size.
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
};

/**
 * Collaborator share of the sub-task currency pool (ceil), by duration or qty.
 * Matches Strapi duration credits; qty uses pool share by pieces produced.
 */
export function calculateColaboratorEarnings(
  input: ColaboratorEarningsInput,
): number {
  const pool = calculateSubtaskPayment(
    input.expectedTime,
    input.currencyPerSecond,
  );
  if (pool <= 0) return 0;

  if (input.sharingType === "qty") {
    const totalQty = Math.max(0, input.totalQty);
    if (totalQty <= 0) return 0;
    const qty = Math.max(0, input.colaboratorQty);
    return Math.ceil((qty / totalQty) * pool);
  }

  const totalDuration = Math.max(0, input.totalDurationSec);
  if (totalDuration <= 0) return 0;
  const duration = Math.max(0, input.colaboratorDurationSec);
  return Math.ceil((duration / totalDuration) * pool);
}
