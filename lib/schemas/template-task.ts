import { z } from "zod";

import { SHARING_TYPES } from "./sub-task";

export const templateSubTaskComponentSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  sharingType: z.enum(SHARING_TYPES),
  maxSameTimeWorkers: z.number().int().min(1),
  index: z.number().int().min(0),
  expectedTime: z.number().int().min(0),
  dependencies: z.unknown().optional().nullable(),
});

export const templateTaskFormSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  subTask: z.array(templateSubTaskComponentSchema).optional(),
});

export type TemplateSubTaskComponentInput = z.infer<
  typeof templateSubTaskComponentSchema
>;
export type TemplateTaskFormInput = z.infer<typeof templateTaskFormSchema>;
