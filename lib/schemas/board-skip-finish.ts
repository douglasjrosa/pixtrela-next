import { z } from "zod";

import { bulkDocumentIdsSchema } from "@/lib/schemas/bulk-ids";

export const skipFinishBoardSubtasksInputSchema = z.object({
  taskDocumentId: z.string().trim().min(1),
  subTaskDocumentIds: bulkDocumentIdsSchema,
});

export type SkipFinishBoardSubtasksInput = z.infer<
  typeof skipFinishBoardSubtasksInputSchema
>;

export const skipFinishBlockedSchema = z.object({
  memberIds: z.array(z.string().trim().min(1)),
  producerNames: z.array(z.string()),
});

export const skipFinishBoardSubtasksResultSchema = z.object({
  skippedIds: z.array(z.string()),
  blocked: z.array(skipFinishBlockedSchema),
});

export type SkipFinishBoardSubtasksResult = z.infer<
  typeof skipFinishBoardSubtasksResultSchema
>;
