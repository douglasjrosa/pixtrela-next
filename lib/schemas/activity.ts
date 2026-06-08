import { z } from "zod";

export const ACTIVITY_ACTIONS = ["started", "stoped"] as const;

export const activityFormSchema = z.object({
  subTaskDocumentId: z.string().min(1),
  action: z.enum(ACTIVITY_ACTIONS),
  completed: z.boolean().optional(),
  qty: z.number().int().min(1).optional(),
});

export type ActivityFormInput = z.infer<typeof activityFormSchema>;
