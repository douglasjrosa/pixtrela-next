import type { BoardTaskProgressInput } from "@/lib/business/task-progress";

export type BoardProgressPollSnapshot = {
  progressByTaskId: Record<string, BoardTaskProgressInput>;
  totalsByTaskId: Record<
    string,
    { totalTimeSpent: number; totalExpectedTime: number }
  >;
  nowMs: number;
};
