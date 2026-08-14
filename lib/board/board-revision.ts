export type BoardRevision = {
  activeTaskCount: number;
  tasksMaxUpdatedAt: string | null;
  subTasksMaxUpdatedAt: string | null;
  activitiesMaxTimestamp: string | null;
  assigneeCount: number;
  stepsMaxUpdatedAt: string | null;
};

export function hasBoardRevisionChanged(
  previous: BoardRevision | null,
  current: BoardRevision,
): boolean {
  if (!previous) return false;
  return (
    previous.activeTaskCount !== current.activeTaskCount ||
    previous.tasksMaxUpdatedAt !== current.tasksMaxUpdatedAt ||
    previous.subTasksMaxUpdatedAt !== current.subTasksMaxUpdatedAt ||
    previous.activitiesMaxTimestamp !== current.activitiesMaxTimestamp ||
    previous.assigneeCount !== current.assigneeCount ||
    previous.stepsMaxUpdatedAt !== current.stepsMaxUpdatedAt
  );
}
