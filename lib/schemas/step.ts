import { z } from "zod";

export const stepNameFormSchema = z.object({
  name: z.string().min(1),
});

export type StepNameFormInput = z.infer<typeof stepNameFormSchema>;

export const stepFormSchema = stepNameFormSchema.extend({
  index: z.number().int().min(0),
});

export type StepFormInput = z.infer<typeof stepFormSchema>;
