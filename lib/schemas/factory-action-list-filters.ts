import { z } from "zod";

import { factoryActionListSortSchema } from "./factory-action-list-sort";
import { TEMPLATE_LIST_SEARCH_MIN_CHARS } from "./template-list-filters";

export const FACTORY_ACTION_LIST_PAGE_SIZE = 10;
export const FACTORY_ACTION_LIST_SEARCH_MIN_CHARS =
  TEMPLATE_LIST_SEARCH_MIN_CHARS;

export const factoryActionListFiltersSchema = z
  .object({
    q: z.string().optional(),
    showArchived: z.boolean().default(false),
  })
  .merge(factoryActionListSortSchema)
  .superRefine((data, ctx) => {
    const trimmedQ = data.q?.trim() ?? "";
    if (
      trimmedQ.length > 0 &&
      trimmedQ.length < FACTORY_ACTION_LIST_SEARCH_MIN_CHARS
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
        trimmedQ.length >= FACTORY_ACTION_LIST_SEARCH_MIN_CHARS
          ? trimmedQ
          : undefined,
      column: data.column,
      direction: data.direction,
      showArchived: data.showArchived,
    };
  });

export type FactoryActionListFilters = z.infer<
  typeof factoryActionListFiltersSchema
>;
