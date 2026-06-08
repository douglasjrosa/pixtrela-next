export interface KanbanStep {
  id: number;
  name: string;
}

export interface KanbanTask {
  id: number;
  name: string;
  status: "queued" | "producing" | "paused" | "finished";
  stepId: number | null;
}
