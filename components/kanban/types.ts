export interface KanbanStep {
  id: number;
  name: string;
}

export interface KanbanTask {
  id: number;
  documentId: string;
  name: string;
  status: "waiting" | "producing" | "paused" | "finished";
  stepId: number | null;
  index: number;
  deliveryDate?: string | null;
}

export interface BoardSubTaskAssignee {
  documentId: string;
  name: string;
}

export interface BoardSubTaskSummary {
  documentId: string;
  name: string;
  status: KanbanTask["status"];
  assignedTo: BoardSubTaskAssignee[];
}
