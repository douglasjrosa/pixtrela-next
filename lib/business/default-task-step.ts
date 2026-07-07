import type { TaskFormInput } from "@/lib/schemas/task";

export interface StepRef {
  documentId: string;
  name: string;
}

const QUEUE_STEP_NAME_PATTERN = /fila/i;

export function resolveDefaultStepDocumentId(steps: StepRef[]): string {
  if (steps.length === 0) return "";
  const queueStep = steps.find((step) =>
    QUEUE_STEP_NAME_PATTERN.test(step.name),
  );
  return (queueStep ?? steps[0]).documentId;
}

export function buildCreateTaskFormDefaults(steps: StepRef[]): TaskFormInput {
  return {
    name: "",
    qty: 1,
    deliveryDate: "",
    stepDocumentId: resolveDefaultStepDocumentId(steps),
    status: "waiting",
    templateTaskCode: "",
  };
}
