import { z } from "zod";

import { ACTIVITY_ACTIONS } from "./activity";

const TIME_HM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const adminActivityFormSchema = z.object({
  colaboratorId: z.string().uuid(),
  subTaskId: z.string().uuid(),
  action: z.enum(ACTIVITY_ACTIONS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(TIME_HM),
  qty: z.number().int().min(0),
});

export type AdminActivityFormInput = z.infer<typeof adminActivityFormSchema>;
