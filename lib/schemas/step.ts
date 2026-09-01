import { z } from "zod";

import {
  stepTaskOrderBySchema,
  type StepTaskOrderBy,
} from "@/lib/schemas/step-task-order-by";

export { stepTaskOrderBySchema, type StepTaskOrderBy };

export const STEP_TASKS_PER_LOAD_MIN = 5;
export const STEP_TASKS_PER_LOAD_MAX = 50;
export const STEP_TASKS_PER_LOAD_DEFAULT = 10;

export const stepNameFormSchema = z.object({
  name: z.string().min(1),
  orderBy: stepTaskOrderBySchema.default("manual"),
  tasksPerLoad: z
    .number()
    .int()
    .min(STEP_TASKS_PER_LOAD_MIN)
    .max(STEP_TASKS_PER_LOAD_MAX)
    .default(STEP_TASKS_PER_LOAD_DEFAULT),
});

export type StepNameFormInput = z.infer<typeof stepNameFormSchema>;

export const stepFormSchema = stepNameFormSchema.extend({
  index: z.number().int().min(0),
});

export type StepFormInput = z.infer<typeof stepFormSchema>;
