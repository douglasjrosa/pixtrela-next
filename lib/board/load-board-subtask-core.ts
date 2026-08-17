import { unstable_cache } from "next/cache";

import { listBoardSubtaskCore } from "@/lib/repos/tasks";

export const BOARD_SUBTASK_CORE_REVALIDATE_SECONDS = 30;
export const DRIZZLE_SUBTASKS_CACHE_TAG = "drizzle:subTasks";

export function boardSubtasksCacheTag(taskId: string): string {
  return `board-subtasks:${taskId}`;
}

export async function loadCachedBoardSubtaskCore(taskId: string) {
  return unstable_cache(
    async () => listBoardSubtaskCore(taskId),
    ["board-subtask-core", taskId],
    {
      revalidate: BOARD_SUBTASK_CORE_REVALIDATE_SECONDS,
      tags: [DRIZZLE_SUBTASKS_CACHE_TAG, boardSubtasksCacheTag(taskId)],
    },
  )();
}
