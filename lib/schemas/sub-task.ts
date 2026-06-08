import { z } from "zod";

export const SUB_TASK_STATUSES = [
  "queued",
  "producing",
  "paused",
  "finished",
] as const;

export const SHARING_TYPES = ["qty", "duration"] as const;

export const ACTIVATION_STATUSES = ["locked", "unlocked", "disabled"] as const;

export const REASON_FOR_DISABLING_MIN_LENGTH = 10;

export const REASON_FOR_DISABLING_MIN_LENGTH_KEY =
  "reasonForDisablingMinLength";

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

    const reason = data.reasonForDisabling?.trim() ?? "";
    if (reason.length < REASON_FOR_DISABLING_MIN_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: REASON_FOR_DISABLING_MIN_LENGTH_KEY,
        path: ["reasonForDisabling"],
      });
    }
  },
);

export type SubTaskFormInput = z.infer<typeof subTaskFormSchema>;
