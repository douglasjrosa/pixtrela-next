import type {
  WorkdayAction,
  WorkdayScope,
  WorkdaySlotInput,
} from "@/lib/schemas/workday";

export interface TargetOption {
  documentId: string;
  name: string;
}

export interface WorkdaySlotRow extends WorkdaySlotInput {
  id: string;
}

export interface WorkdayRow {
  documentId: string;
  description: string | null;
  action: WorkdayAction;
  scope: WorkdayScope;
  timezone: string;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  teams: TargetOption[];
  users: TargetOption[];
  slots: WorkdaySlotRow[];
  editable: boolean;
  archivable: boolean;
}
