"use server";

import { isDrizzleBackend } from "@/lib/db/backend";
import type { BoardRevision } from "@/lib/board/board-revision";
import { getBoardRevision } from "@/lib/repos/board-revision";

const EMPTY_BOARD_REVISION: BoardRevision = {
  activeTaskCount: 0,
  tasksMaxUpdatedAt: null,
  subTasksMaxUpdatedAt: null,
  activitiesMaxTimestamp: null,
  assigneeCount: 0,
  stepsMaxUpdatedAt: null,
};

export async function pollBoardRevision(): Promise<BoardRevision> {
  if (!isDrizzleBackend()) {
    return EMPTY_BOARD_REVISION;
  }
  return getBoardRevision();
}
