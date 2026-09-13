import type { TaskFormInput } from "@/lib/schemas/task";

export interface StepOption {
  documentId: string;
  name: string;
}

/** List row uses lean fields; detail may also set optional metadata. */
export interface TaskRow {
  documentId: string;
  crmItemKey?: string | null;
  name: string;
  qty: number;
  deliveryDate?: string | null;
  status: TaskFormInput["status"];
  active: boolean;
  totalExpectedTime: number;
  totalTimeSpent: number;
  finishedSubTaskCount: number;
  totalSubTaskCount: number;
  /** Detail-only fields (not selected by listTasksPaged). */
  index?: number;
  reasonForDeactivation?: string | null;
  templateTaskCode?: string | null;
  step?: { documentId: string; name: string } | null;
}
