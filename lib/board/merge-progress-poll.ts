import type { KanbanTask } from "@/components/kanban/types";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import { needsLiveBoardProgress } from "@/lib/business/task-progress";

/** Merges a no-store progress poll into board task rows (live tasks only). */
export function mergeBoardProgressPoll(
  tasks: readonly KanbanTask[],
  snapshot: BoardProgressPollSnapshot,
): KanbanTask[] {
  return tasks.map((task) => {
    if (!needsLiveBoardProgress(task.status) || task.totalExpectedTime <= 0) {
      return task;
    }
    const progress = snapshot.progressByTaskId[task.documentId];
    const totals = snapshot.totalsByTaskId[task.documentId];
    return {
      ...task,
      progressPending: false,
      progressInput: progress ??
        task.progressInput ?? {
          subTasks: [],
          openActivityStartedAts: [],
        },
      totalTimeSpent: totals?.totalTimeSpent ?? task.totalTimeSpent,
      totalExpectedTime: totals?.totalExpectedTime ?? task.totalExpectedTime,
      progressNowMs: snapshot.nowMs,
    };
  });
}
