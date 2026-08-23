import { z } from "zod";

import {
  BULK_DEACTIVATION_REASON_MIN_LENGTH,
  BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY,
  refineDeactivationReason,
} from "./deactivation-reason";

export const TASK_STATUSES = [
  "waiting",
  "producing",
  "paused",
  "finished",
  "reviewed",
  "delivered",
] as const;

export const taskFormSchema = z.object({
  name: z.string().trim().min(1),
  qty: z.coerce.number().int().min(1),
  deliveryDate: z.string().trim().min(1),
  stepDocumentId: z.string().trim().min(1),
  status: z.enum(TASK_STATUSES),
  templateTaskCode: z.string().optional(),
});

export type TaskFormInput = z.infer<typeof taskFormSchema>;

export const taskDeactivationSchema = z
  .object({
    reasonForDeactivation: z.string(),
  })
  .superRefine((data, ctx) => {
    refineDeactivationReason(data.reasonForDeactivation, ctx, [
      "reasonForDeactivation",
    ]);
  });

export type TaskDeactivationInput = z.infer<typeof taskDeactivationSchema>;

export const bulkTaskDeactivationSchema = z
  .object({
    reasonForDeactivation: z.string(),
  })
  .superRefine((data, ctx) => {
    refineDeactivationReason(
      data.reasonForDeactivation,
      ctx,
      ["reasonForDeactivation"],
      BULK_DEACTIVATION_REASON_MIN_LENGTH,
      BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY,
    );
  });

export { bulkDocumentIdsSchema as bulkTaskIdsSchema } from "./bulk-ids";
