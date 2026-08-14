import type { KanbanTask } from "@/components/kanban/types";
import type { BoardCardBadges } from "@/lib/board/load-board-progress";
import type { BoardTaskProgressInput } from "@/lib/business/task-progress";

export type BoardTaskLayoutSnapshot = Pick<
  KanbanTask,
  | "status"
  | "stepId"
  | "index"
  | "name"
  | "qty"
  | "deliveryDate"
  | "endedAt"
>;

export type BoardProgressPollSnapshot = {
  progressByTaskId: Record<string, BoardTaskProgressInput>;
  badgesByTaskId: Record<string, BoardCardBadges>;
  assignedCountByColaboratorId: Record<string, number>;
  totalsByTaskId: Record<
    string,
    { totalTimeSpent: number; totalExpectedTime: number }
  >;
  layoutByTaskId: Record<string, BoardTaskLayoutSnapshot>;
  nowMs: number;
};
