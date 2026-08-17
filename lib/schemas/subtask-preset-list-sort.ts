import { z } from "zod";

export const SUBTASK_PRESET_LIST_SORT_COLUMNS = [
  "name",
  "sharingType",
  "expectedTime",
] as const;

export const SUBTASK_PRESET_LIST_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const SUBTASK_PRESET_LIST_DEFAULT_SORT_COLUMN = "name" as const;
export const SUBTASK_PRESET_LIST_DEFAULT_SORT_DIRECTION = "asc" as const;

export const subtaskPresetListSortSchema = z.object({
  column: z
    .enum(SUBTASK_PRESET_LIST_SORT_COLUMNS)
    .default(SUBTASK_PRESET_LIST_DEFAULT_SORT_COLUMN),
  direction: z
    .enum(SUBTASK_PRESET_LIST_SORT_DIRECTIONS)
    .default(SUBTASK_PRESET_LIST_DEFAULT_SORT_DIRECTION),
});

export type SubtaskPresetListSortColumn = z.infer<
  typeof subtaskPresetListSortSchema
>["column"];
export type SubtaskPresetListSortDirection = z.infer<
  typeof subtaskPresetListSortSchema
>["direction"];
export type SubtaskPresetListSort = z.infer<typeof subtaskPresetListSortSchema>;

export function nextSubtaskPresetListSort(
  current: SubtaskPresetListSort,
  column: SubtaskPresetListSortColumn,
): SubtaskPresetListSort {
  if (current.column !== column) {
    return { column, direction: "asc" };
  }
  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function isDefaultSubtaskPresetListSort(
  sort: SubtaskPresetListSort,
): boolean {
  return (
    sort.column === SUBTASK_PRESET_LIST_DEFAULT_SORT_COLUMN &&
    sort.direction === SUBTASK_PRESET_LIST_DEFAULT_SORT_DIRECTION
  );
}
