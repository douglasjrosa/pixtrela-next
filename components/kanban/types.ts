import type { BoardTaskProgressInput } from "@/lib/business/task-progress";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { StepTaskOrderBy } from "@/lib/schemas/step-task-order-by";

export interface KanbanStep {
  id: number;
  documentId: string;
  name: string;
  taskOrderBy: StepTaskOrderBy;
  tasksPerLoad: number;
}

export interface KanbanTask {
  id: number;
  documentId: string;
  name: string;
  qty: number;
  status: "waiting" | "producing" | "paused" | "finished" | "reviewed" | "delivered";
  stepId: number | null;
  index: number;
  deliveryDate?: string | null;
  /** When the task became finished (last sub-task stop). */
  endedAt?: string | null;
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
  /** Unique colaborators who worked on this finished task. */
  participantCount?: number;
}


export interface BoardSubTaskAssignee {
  documentId: string;
  name: string;
}

export interface BoardSubTaskSummary {
  documentId: string;
  name: string;
  status: SubTaskFormInput["status"];
  sharingType: "qty" | "duration";
  /** Base piece count on the sub-task (before task.qty scaling). */
  qty: number;
  index: number;
  expectedTime: number;
  timeSpent: number;
  maxSameTimeWorkers: number;
  linkedToPrevious: boolean;
  openActivityStartedAts: string[];
  /** Colaborators with an open started activity on this sub-task. */
  producingColaboratorIds: string[];
  /** Empty on fast board load; filled after lazy session fetch (finished tab / info). */
  sessions: import("@/lib/business/task-progress").ActivitySession[];
  assignedTo: BoardSubTaskAssignee[];
  assignedFlagCodes?: string[];
  dependencyFlags?: { predecessorName: string; codes: string[] }[];
}
