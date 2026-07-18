export type AssignedSubTaskCountInput = {
  assignedToIds: readonly string[];
};

/**
 * Counts unfinished board sub-tasks per colaborator (one pass).
 * Callers must pass only unfinished, non-disabled sub-tasks.
 */
export function countAssignedSubTasksByColaborator(
  subTasks: readonly AssignedSubTaskCountInput[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const subTask of subTasks) {
    for (const colaboratorId of subTask.assignedToIds) {
      counts[colaboratorId] = (counts[colaboratorId] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Low-load warn: show when the colaborator has some assignments but not more
 * than assignWarnMax. Zero max disables the badge; zero count stays hidden.
 */
export function shouldShowAssignWarn(
  count: number,
  assignWarnMax: number,
): boolean {
  if (assignWarnMax <= 0) return false;
  return count >= 1 && count <= assignWarnMax;
}

/** Applies ±1 to a count map when toggling an assignee on an open sub-task. */
export function adjustAssignedCount(
  counts: Readonly<Record<string, number>>,
  colaboratorId: string,
  delta: 1 | -1,
): Record<string, number> {
  const next = { ...counts };
  const value = Math.max(0, (next[colaboratorId] ?? 0) + delta);
  if (value === 0) {
    delete next[colaboratorId];
  } else {
    next[colaboratorId] = value;
  }
  return next;
}
