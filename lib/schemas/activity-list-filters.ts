import { z } from "zod";

import { ACTIVITY_ACTIONS } from "./activity";
import { activityListSortSchema } from "./activity-list-sort";

export const ACTIVITY_LIST_PAGE_SIZE = 10;
export const ACTIVITY_LIST_NAME_MIN_CHARS = 3;
export const ACTIVITY_LIST_DEFAULT_LOOKBACK_DAYS = 30;
export const ACTIVITY_LIST_SEARCH_DEBOUNCE_MS = 300;

export const ACTIVITY_LIST_DEFAULT_ACTIONS = [...ACTIVITY_ACTIONS] as const;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const activityListFiltersSchema = z
  .object({
    actions: z
      .array(z.enum(ACTIVITY_ACTIONS))
      .min(1)
      .default([...ACTIVITY_LIST_DEFAULT_ACTIONS]),
    from: z.string().regex(DATE_ONLY),
    to: z.string().regex(DATE_ONLY),
    q: z.string().optional(),
    showArchived: z.boolean().default(false),
  })
  .merge(activityListSortSchema)
  .superRefine((data, ctx) => {
    if (data.to && data.from > data.to) {
      ctx.addIssue({
        code: "custom",
        message: "fromAfterTo",
        path: ["to"],
      });
    }
    const trimmed = data.q?.trim() ?? "";
    if (trimmed.length > 0 && trimmed.length < ACTIVITY_LIST_NAME_MIN_CHARS) {
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
      actions: [...new Set(data.actions)].sort() as Array<
        (typeof ACTIVITY_ACTIONS)[number]
      >,
      from: data.from,
      to: data.to,
      q:
        trimmed.length >= ACTIVITY_LIST_NAME_MIN_CHARS ? trimmed : undefined,
      column: data.column,
      direction: data.direction,
      showArchived: data.showArchived,
    };
  });

export type ActivityListFilters = z.infer<typeof activityListFiltersSchema>;
export type ActivityListFiltersInput = z.input<
  typeof activityListFiltersSchema
>;
