import type { BoardTaskProgressInput } from "@/lib/business/task-progress";

export interface KanbanStep {
  id: number;
  name: string;
}

export interface KanbanTask {
  id: number;
  documentId: string;
  name: string;
  qty: number;
  status: "waiting" | "producing" | "paused" | "finished";
  stepId: number | null;
  index: number;
  deliveryDate?: string | null;
  totalExpectedTime: number;
  totalTimeSpent: number;
  /** When true, show progress skeleton (Suspense fallback). */
  progressPending?: boolean;
  progressInput?: BoardTaskProgressInput;
  progressNowMs?: number;
  /** Unique colaborators with an open activity on this task. */
  activeColaboratorCount?: number;
  /** Unfinished sub-tasks with zero assignees. */
  unassignedSubTaskCount?: number;
}


export interface BoardSubTaskAssignee {
  documentId: string;
  name: string;
}

export interface BoardSubTaskSummary {
  documentId: string;
  name: string;
  status: KanbanTask["status"];
  sharingType: "qty" | "duration";
  expectedTime: number;
  timeSpent: number;
  openActivityStartedAts: string[];
  sessions: import("@/lib/business/task-progress").ActivitySession[];
  assignedTo: BoardSubTaskAssignee[];
}
