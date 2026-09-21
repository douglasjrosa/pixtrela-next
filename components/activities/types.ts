export type ActivityRow = {
  documentId: string;
  action: "started" | "stoped";
  timestamp: string;
  qty: number;
  active: boolean;
  currencyAwarded: number;
  colaboratorId: string;
  colaboratorName: string;
  colaboratorCode: number | null;
  subTaskId: string;
  subTaskName: string;
  taskName: string;
};

export type ActivityFormOption = {
  id: string;
  name: string;
  code?: number | null;
  taskName?: string;
};
