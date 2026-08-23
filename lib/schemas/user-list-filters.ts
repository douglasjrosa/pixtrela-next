import { z } from "zod";

import { userListSortSchema } from "./user-list-sort";

export const USER_LIST_PAGE_SIZE = 10;
export const USER_LIST_SEARCH_MIN_CHARS = 1;
export const USER_LIST_SEARCH_DEBOUNCE_MS = 300;

export const userListFiltersSchema = z
  .object({
    q: z.string().optional(),
    showArchived: z.boolean().default(false),
  })
  .merge(userListSortSchema)
  .superRefine((data, ctx) => {
    const trimmedQ = data.q?.trim() ?? "";
    if (
      trimmedQ.length > 0 &&
      trimmedQ.length < USER_LIST_SEARCH_MIN_CHARS
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
        trimmedQ.length >= USER_LIST_SEARCH_MIN_CHARS ? trimmedQ : undefined,
      column: data.column,
      direction: data.direction,
      showArchived: data.showArchived,
    };
  });

export type UserListFilters = z.infer<typeof userListFiltersSchema>;
export type UserListFiltersInput = z.input<typeof userListFiltersSchema>;
