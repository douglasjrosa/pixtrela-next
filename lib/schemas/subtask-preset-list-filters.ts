import { z } from "zod";

import { TEMPLATE_LIST_SEARCH_MIN_CHARS } from "./template-list-filters";
import { subtaskPresetListSortSchema } from "./subtask-preset-list-sort";

export const SUBTASK_PRESET_LIST_PAGE_SIZE = 10;
export const SUBTASK_PRESET_LIST_SEARCH_MIN_CHARS =
  TEMPLATE_LIST_SEARCH_MIN_CHARS;

export const subtaskPresetListFiltersSchema = z
  .object({
    q: z.string().optional(),
    showArchived: z.boolean().default(false),
  })
  .merge(subtaskPresetListSortSchema)
  .superRefine((data, ctx) => {
    const trimmedQ = data.q?.trim() ?? "";
    if (
      trimmedQ.length > 0 &&
      trimmedQ.length < SUBTASK_PRESET_LIST_SEARCH_MIN_CHARS
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
        trimmedQ.length >= SUBTASK_PRESET_LIST_SEARCH_MIN_CHARS
          ? trimmedQ
          : undefined,
      column: data.column,
      direction: data.direction,
      showArchived: data.showArchived,
    };
  });

export type SubtaskPresetListFilters = z.infer<
  typeof subtaskPresetListFiltersSchema
>;
export type SubtaskPresetListFiltersInput = z.input<
  typeof subtaskPresetListFiltersSchema
>;
