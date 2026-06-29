import { z } from "zod";

import { SHARING_TYPES } from "./sub-task";

export const templateSubTaskFormSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  expectedTime: z.number().int().min(0),
  sharingType: z.enum(SHARING_TYPES),
  maxSameTimeWorkers: z.number().int().min(1),
  dependencyIds: z.array(z.string()).default([]),
});

export type TemplateSubTaskFormInput = z.infer<typeof templateSubTaskFormSchema>;
