import { z } from "zod";

import {
  DEFAULT_ASSIGN_WARN_MAX,
  MAX_ASSIGN_WARN_MAX,
  MIN_ASSIGN_WARN_MAX,
} from "@/lib/business/assign-warn-max";

const optionalStepDocumentId = z
  .string()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : ""));

export const taskAutomationFormSchema = z.object({
  waitingStepDocumentId: optionalStepDocumentId,
  producingStepDocumentId: optionalStepDocumentId,
  pausedStepDocumentId: optionalStepDocumentId,
  finishedStepDocumentId: optionalStepDocumentId,
  reviewedStepDocumentId: optionalStepDocumentId,
  deliveredStepDocumentId: optionalStepDocumentId,
  assignWarnMax: z
    .number()
    .int()
    .min(MIN_ASSIGN_WARN_MAX)
    .max(MAX_ASSIGN_WARN_MAX)
    .default(DEFAULT_ASSIGN_WARN_MAX),
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
  {
    status: "reviewed" as const,
    field: "reviewedStepDocumentId" as const,
  },
  {
    status: "delivered" as const,
    field: "deliveredStepDocumentId" as const,
  },
] as const;
