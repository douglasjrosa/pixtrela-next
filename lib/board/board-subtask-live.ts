import type { BoardSubTaskSummary } from "@/components/kanban/types";
import type { BoardSubtaskActivityRow } from "@/lib/repos/tasks";
import {
  listOpenActivityStartedAts,
  listOpenColaboratorDocumentIds,
  type ActivitySessionRef,
} from "@/lib/business/task-progress";

export type BoardSubtaskLiveState = {
  producingColaboratorIds: string[];
  openActivityStartedAts: string[];
};

export function liveStateFromOpenActivityRows(
  rows: readonly BoardSubtaskActivityRow[],
): Record<string, BoardSubtaskLiveState> {
  const refsBySubTask = new Map<string, ActivitySessionRef[]>();
  for (const row of rows) {
    const list = refsBySubTask.get(row.subTaskId) ?? [];
    list.push({
      subTaskDocumentId: row.subTaskId,
      colaboratorDocumentId: row.colaboratorId,
      colaboratorName: row.colaboratorName,
      action: row.action,
      timestamp: row.timestamp.toISOString(),
      qty: row.qty,
    });
    refsBySubTask.set(row.subTaskId, list);
  }

  const liveBySubTaskId: Record<string, BoardSubtaskLiveState> = {};
  for (const [subTaskId, refs] of refsBySubTask) {
    liveBySubTaskId[subTaskId] = {
      producingColaboratorIds: listOpenColaboratorDocumentIds(refs),
      openActivityStartedAts: listOpenActivityStartedAts(refs),
    };
  }
  return liveBySubTaskId;
}

export function mergeBoardSubtaskLiveState(
  subtasks: readonly BoardSubTaskSummary[],
  liveBySubTaskId: Record<string, BoardSubtaskLiveState>,
): BoardSubTaskSummary[] {
  return subtasks.map((subtask) => {
    const live = liveBySubTaskId[subtask.documentId];
    return {
      ...subtask,
      producingColaboratorIds: live?.producingColaboratorIds ?? [],
      openActivityStartedAts: live?.openActivityStartedAts ?? [],
    };
  });
}
