import { z } from "zod";

import { SHARING_TYPES } from "./sub-task";

export const subTaskPresetFormSchema = z.object({
  name: z.string().min(1),
  sharingType: z.enum(SHARING_TYPES),
  maxSameTimeWorkers: z.number().int().min(1),
  actionId: z.string().uuid(),
  subTaskCategoryId: z.string().uuid().optional().nullable(),
  defaultDependencyPresetIds: z.array(z.string().uuid()).default([]),
});

export type SubTaskPresetFormInput = z.infer<typeof subTaskPresetFormSchema>;
