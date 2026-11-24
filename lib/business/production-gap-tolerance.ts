export const DEFAULT_PRODUCTION_GAP_TOLERANCE_MINUTES = 30;
export const MIN_PRODUCTION_GAP_TOLERANCE_MINUTES = 0;
export const MAX_PRODUCTION_GAP_TOLERANCE_MINUTES = 1440;

export function normalizeProductionGapToleranceMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PRODUCTION_GAP_TOLERANCE_MINUTES;
  }
  const rounded = Math.round(value);
  return Math.min(
    MAX_PRODUCTION_GAP_TOLERANCE_MINUTES,
    Math.max(MIN_PRODUCTION_GAP_TOLERANCE_MINUTES, rounded),
  );
}
