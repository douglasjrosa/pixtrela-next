import { z } from "zod";

import {
  stepTaskOrderBySchema,
  type StepTaskOrderBy,
} from "@/lib/schemas/step-task-order-by";

export { stepTaskOrderBySchema, type StepTaskOrderBy };

export const stepNameFormSchema = z.object({
  name: z.string().min(1),
  orderBy: stepTaskOrderBySchema.default("manual"),
});

export type StepNameFormInput = z.infer<typeof stepNameFormSchema>;

export const stepFormSchema = stepNameFormSchema.extend({
  index: z.number().int().min(0),
});

export type StepFormInput = z.infer<typeof stepFormSchema>;
