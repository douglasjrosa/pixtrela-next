import { z } from "zod";

import { WORKDAY_ACTIONS, WORKDAY_SCOPES } from "./workday";
import { workdayListSortSchema } from "./workday-list-sort";

export const WORKDAY_LIST_PAGE_SIZE = 10;
export const WORKDAY_LIST_SEARCH_MIN_CHARS = 1;

const optionalIsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

export const workdayListFiltersSchema = z
  .object({
    q: z.string().optional(),
    action: z.enum(WORKDAY_ACTIONS).optional(),
    scope: z.enum(WORKDAY_SCOPES).optional(),
    dateFrom: optionalIsoDate,
    dateTo: optionalIsoDate,
    showArchived: z.boolean().default(false),
  })
  .merge(workdayListSortSchema)
  .superRefine((data, ctx) => {
    const trimmedQ = data.q?.trim() ?? "";
    if (
      trimmedQ.length > 0 &&
      trimmedQ.length < WORKDAY_LIST_SEARCH_MIN_CHARS
    ) {
      ctx.addIssue({
        code: "custom",
        message: "qTooShort",
        path: ["q"],
      });
    }
    if (data.dateFrom && data.dateTo && data.dateTo < data.dateFrom) {
      ctx.addIssue({
        code: "custom",
        message: "dateOrder",
        path: ["dateTo"],
      });
    }
  })
  .transform((data) => {
    const trimmedQ = data.q?.trim() ?? "";
    return {
      q:
        trimmedQ.length >= WORKDAY_LIST_SEARCH_MIN_CHARS
          ? trimmedQ
          : undefined,
      action: data.action,
      scope: data.scope,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      showArchived: data.showArchived,
      column: data.column,
      direction: data.direction,
    };
  });

export type WorkdayListFilters = z.infer<typeof workdayListFiltersSchema>;
export type WorkdayListFiltersInput = z.input<typeof workdayListFiltersSchema>;
