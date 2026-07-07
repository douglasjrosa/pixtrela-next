import { z } from "zod";

const optionalStepDocumentId = z
  .string()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : ""));

export const taskAutomationFormSchema = z.object({
  waitingStepDocumentId: optionalStepDocumentId,
  producingStepDocumentId: optionalStepDocumentId,
  pausedStepDocumentId: optionalStepDocumentId,
  finishedStepDocumentId: optionalStepDocumentId,
});

export type TaskAutomationFormInput = z.infer<typeof taskAutomationFormSchema>;

export const TASK_AUTOMATION_STATUS_FIELDS = [
  {
    status: "waiting" as const,
    field: "waitingStepDocumentId" as const,
  },
  {
    status: "producing" as const,
    field: "producingStepDocumentId" as const,
  },
  {
    status: "paused" as const,
    field: "pausedStepDocumentId" as const,
  },
  {
    status: "finished" as const,
    field: "finishedStepDocumentId" as const,
  },
] as const;
