const MS_PER_MINUTE = 60_000;

export type ProductionGapInput = {
  windowStartedAt: Date;
  now: Date;
  lastStartAt: Date | null;
  toleranceMinutes: number;
};

export function isPossibleProductionGap(input: ProductionGapInput): boolean {
  const windowStartMs = input.windowStartedAt.getTime();
  const nowMs = input.now.getTime();
  if (!Number.isFinite(windowStartMs) || !Number.isFinite(nowMs)) return false;
  if (nowMs < windowStartMs) return false;

  const graceMs = Math.max(0, input.toleranceMinutes) * MS_PER_MINUTE;
  if (nowMs < windowStartMs + graceMs) return false;

  if (!input.lastStartAt) return true;
  const lastStartMs = input.lastStartAt.getTime();
  if (!Number.isFinite(lastStartMs)) return true;
  return lastStartMs < windowStartMs;
}
