import { z } from "zod";

export const stepFormSchema = z.object({
  name: z.string().min(1),
  index: z.number().int().min(0),
});

export type StepFormInput = z.infer<typeof stepFormSchema>;
