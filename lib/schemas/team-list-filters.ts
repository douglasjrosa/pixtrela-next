import { z } from "zod";

import { teamListSortSchema } from "./team-list-sort";

export const TEAM_LIST_PAGE_SIZE = 10;
export const TEAM_LIST_SEARCH_MIN_CHARS = 1;
export const TEAM_LIST_SEARCH_DEBOUNCE_MS = 300;

export const teamListFiltersSchema = z
  .object({
    q: z.string().optional(),
    showArchived: z.boolean().default(false),
  })
  .merge(teamListSortSchema)
  .superRefine((data, ctx) => {
    const trimmedQ = data.q?.trim() ?? "";
    if (
      trimmedQ.length > 0 &&
      trimmedQ.length < TEAM_LIST_SEARCH_MIN_CHARS
    ) {
      ctx.addIssue({
        code: "custom",
        message: "qTooShort",
        path: ["q"],
      });
    }
  })
  .transform((data) => {
    const trimmedQ = data.q?.trim() ?? "";
    return {
      q:
        trimmedQ.length >= TEAM_LIST_SEARCH_MIN_CHARS ? trimmedQ : undefined,
      column: data.column,
      direction: data.direction,
      showArchived: data.showArchived,
    };
  });

export type TeamListFilters = z.infer<typeof teamListFiltersSchema>;
export type TeamListFiltersInput = z.input<typeof teamListFiltersSchema>;
