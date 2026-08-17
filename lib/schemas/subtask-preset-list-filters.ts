import { z } from "zod";

import { subtaskPresetListSortSchema } from "./subtask-preset-list-sort";

export const SUBTASK_PRESET_LIST_PAGE_SIZE = 10;

export const subtaskPresetListFiltersSchema = subtaskPresetListSortSchema;

export type SubtaskPresetListFilters = z.infer<
  typeof subtaskPresetListFiltersSchema
>;
export type SubtaskPresetListFiltersInput = z.input<
  typeof subtaskPresetListFiltersSchema
>;
