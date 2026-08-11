export type TasksRevision = {
  count: number;
  maxUpdatedAt: string | null;
};

export function hasTasksRevisionChanged(
  previous: TasksRevision | null,
  current: TasksRevision,
): boolean {
  if (!previous) return false;
  return (
    previous.count !== current.count ||
    previous.maxUpdatedAt !== current.maxUpdatedAt
  );
}
