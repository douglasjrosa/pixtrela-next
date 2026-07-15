import type { TaskFormInput } from "@/lib/schemas/task";

export interface StepOption {
  documentId: string;
  name: string;
}

export interface TaskRow {
  documentId: string;
  name: string;
  qty: number;
  deliveryDate?: string | null;
  index: number;
  status: TaskFormInput["status"];
  active: boolean;
  reasonForDeactivation?: string | null;
  templateTaskCode?: string | null;
  totalExpectedTime: number;
  totalTimeSpent: number;
  step?: { documentId: string; name: string } | null;
}
