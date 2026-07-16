import type { BoardSubTaskSummary } from "@/components/kanban/types";

/** Defaults for tests / draft merges that only care about assignees. */
export function boardSubTaskSummaryStub(
  partial: Pick<BoardSubTaskSummary, "documentId" | "name" | "status"> &
    Partial<BoardSubTaskSummary>,
): BoardSubTaskSummary {
  return {
    sharingType: "duration",
    expectedTime: 0,
    timeSpent: 0,
    openActivityStartedAts: [],
    sessions: [],
    assignedTo: [],
    ...partial,
  };
}
