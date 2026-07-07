import { z } from "zod";

export const TASK_STATUSES = [
  "waiting",
  "producing",
  "paused",
  "finished",
] as const;

export const taskFormSchema = z.object({
  name: z.string().trim().min(1),
  qty: z.coerce.number().int().min(1),
  deliveryDate: z.string().optional(),
  stepDocumentId: z.string().trim().min(1),
  status: z.enum(TASK_STATUSES),
  templateTaskCode: z.string().optional(),
});

export type TaskFormInput = z.infer<typeof taskFormSchema>;
