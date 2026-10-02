export type TaskAutomationStepMapping = {
  waitingStepId: string | null;
  producingStepId: string | null;
  pausedStepId: string | null;
  finishedStepId: string | null;
  reviewedStepId: string | null;
  deliveredStepId: string | null;
};

const STEP_ID_BY_STATUS = {
  waiting: "waitingStepId",
  producing: "producingStepId",
  paused: "pausedStepId",
  finished: "finishedStepId",
  reviewed: "reviewedStepId",
  delivered: "deliveredStepId",
} as const;

type MappedStatus = keyof typeof STEP_ID_BY_STATUS;

function isMappedStatus(status: string): status is MappedStatus {
  return status in STEP_ID_BY_STATUS;
}

export function resolveAutomatedStepId(
  status: string,
  mapping: TaskAutomationStepMapping,
): string | null {
  if (!isMappedStatus(status)) return null;
  const stepId = mapping[STEP_ID_BY_STATUS[status]];
  return stepId && stepId.length > 0 ? stepId : null;
}

export function nextTaskStepIdAfterStatusChange(
  currentStepId: string | null,
  status: string,
  mapping: TaskAutomationStepMapping | null,
): string | null {
  if (!mapping) return currentStepId;
  return resolveAutomatedStepId(status, mapping) ?? currentStepId;
}
