export const DEFAULT_ASSIGN_WARN_MAX = 4;
export const MIN_ASSIGN_WARN_MAX = 0;
export const MAX_ASSIGN_WARN_MAX = 100;

export function normalizeAssignWarnMax(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ASSIGN_WARN_MAX;
  }
  const rounded = Math.round(value);
  return Math.min(
    MAX_ASSIGN_WARN_MAX,
    Math.max(MIN_ASSIGN_WARN_MAX, rounded),
  );
}
