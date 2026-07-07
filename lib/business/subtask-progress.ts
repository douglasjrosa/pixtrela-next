const FULL_PROGRESS_PERCENT = 100;

export function resolveProgressPercent(
  elapsedSec: number,
  expectedSec: number,
): number {
  if (expectedSec <= 0) return 0;
  return Math.min(
    FULL_PROGRESS_PERCENT,
    (Math.max(0, elapsedSec) / expectedSec) * FULL_PROGRESS_PERCENT,
  );
}

export function isOverExpected(
  elapsedSec: number,
  expectedSec: number,
): boolean {
  return expectedSec > 0 && elapsedSec > expectedSec;
}
