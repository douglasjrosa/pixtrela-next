import type { StepRecord } from "@/lib/repos/steps";
import type { StepNameFormInput } from "@/lib/schemas/step";

export type SettingsStepRow = {
  documentId: string;
  name: string;
  index: number;
  orderBy: StepNameFormInput["orderBy"];
  tasksPerLoad: number;
};

export function mapStepRecordToSettingsRow(
  step: StepRecord,
): SettingsStepRow {
  return {
    documentId: step.id,
    name: step.name,
    index: step.index,
    orderBy: step.taskOrderBy,
    tasksPerLoad: step.tasksPerLoad,
  };
}
