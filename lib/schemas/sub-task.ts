import { z } from "zod";

import { refineDeactivationReason } from "./deactivation-reason";

export const SUB_TASK_STATUSES = [
  "waiting",
  "producing",
  "paused",
  "finished",
] as const;

export const SHARING_TYPES = ["qty", "duration"] as const;

export const ACTIVATION_STATUSES = ["locked", "unlocked", "disabled"] as const;

const subTaskFormBaseSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  expectedTime: z.number().int().min(0),
  sharingType: z.enum(SHARING_TYPES),
  maxSameTimeWorkers: z.number().int().min(1),
  status: z.enum(SUB_TASK_STATUSES),
  assignedToIds: z.array(z.string()).optional(),
  dependencyIds: z.array(z.string()).default([]),
  activationStatus: z.enum(ACTIVATION_STATUSES).default("locked"),
  reasonForDisabling: z.string().optional(),
});

export const subTaskFormSchema = subTaskFormBaseSchema.superRefine(
  (data, ctx) => {
    if (data.activationStatus !== "disabled") return;
    refineDeactivationReason(data.reasonForDisabling, ctx, [
      "reasonForDisabling",
    ]);
  },
);

export type SubTaskFormInput = z.infer<typeof subTaskFormSchema>;
