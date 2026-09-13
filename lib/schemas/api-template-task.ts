import { z } from "zod";

import { templateTaskFormSchema } from "@/lib/schemas/template-task";

export const apiTemplateTaskCreateSchema = templateTaskFormSchema;

export const apiTemplateTaskPatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  subTask: templateTaskFormSchema.shape.subTask.optional(),
});

export type ApiTemplateTaskCreateInput = z.infer<
  typeof apiTemplateTaskCreateSchema
>;
export type ApiTemplateTaskPatchInput = z.infer<
  typeof apiTemplateTaskPatchSchema
>;
