import { z } from "zod";

import { TASK_STATUSES } from "./task";

export const TASK_LIST_PAGE_SIZE = 10;
export const TASK_LIST_NAME_MIN_CHARS = 3;
export const TASK_LIST_DEFAULT_LOOKBACK_DAYS = 30;
export const TASK_LIST_SEARCH_DEBOUNCE_MS = 300;

export const TASK_LIST_DEFAULT_STATUSES = [
  "waiting",
  "producing",
  "paused",
] as const satisfies ReadonlyArray<(typeof TASK_STATUSES)[number]>;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const taskListFiltersSchema = z
  .object({
    statuses: z
      .array(z.enum(TASK_STATUSES))
      .min(1)
      .default([...TASK_LIST_DEFAULT_STATUSES]),
    from: z.string().regex(DATE_ONLY),
    to: z.string().regex(DATE_ONLY).optional(),
    q: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.to && data.from > data.to) {
      ctx.addIssue({
        code: "custom",
        message: "fromAfterTo",
        path: ["to"],
      });
    }
    const trimmed = data.q?.trim() ?? "";
    if (trimmed.length > 0 && trimmed.length < TASK_LIST_NAME_MIN_CHARS) {
      ctx.addIssue({
        code: "custom",
        message: "qTooShort",
        path: ["q"],
      });
    }
  })
  .transform((data) => {
    const trimmed = data.q?.trim() ?? "";
    return {
      statuses: [...new Set(data.statuses)].sort() as Array<
        (typeof TASK_STATUSES)[number]
      >,
      from: data.from,
      to: data.to,
      q: trimmed.length >= TASK_LIST_NAME_MIN_CHARS ? trimmed : undefined,
    };
  });

export type TaskListFilters = z.infer<typeof taskListFiltersSchema>;
export type TaskListFiltersInput = z.input<typeof taskListFiltersSchema>;
