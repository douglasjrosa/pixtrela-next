import { z } from "zod";

export const STEP_TASK_ORDER_BY_VALUES = [
  "manual",
  "delivery_date_asc",
  "delivery_date_desc",
  "created_at_asc",
  "created_at_desc",
] as const;

export const stepTaskOrderBySchema = z.enum(STEP_TASK_ORDER_BY_VALUES);

export type StepTaskOrderBy = z.infer<typeof stepTaskOrderBySchema>;

export function isAutoStepTaskOrder(orderBy: StepTaskOrderBy): boolean {
  return orderBy !== "manual";
}
