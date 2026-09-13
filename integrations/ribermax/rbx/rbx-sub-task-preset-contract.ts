import { z } from "zod";

export const rbxSubTaskPresetItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  sharingType: z.enum(["qty", "duration"]),
  actionName: z.string().min(1),
  actionUnitTime: z.number().nonnegative(),
  maxSameTimeWorkers: z.number().int().positive(),
});

export const rbxSubTaskPresetsResponseSchema = z.object({
  presets: z.array(rbxSubTaskPresetItemSchema),
});

export type RbxSubTaskPresetItem = z.infer<typeof rbxSubTaskPresetItemSchema>;
export type RbxSubTaskPresetsResponse = z.infer<
  typeof rbxSubTaskPresetsResponseSchema
>;
