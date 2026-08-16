import { cache } from "react";

import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { listSubTaskPresetsPaged } from "@/lib/repos/sub-task-presets";
import {
  SUBTASK_PRESET_LIST_PAGE_SIZE,
  type SubtaskPresetListFilters,
} from "@/lib/schemas/subtask-preset-list-filters";
import { subtaskPresetListFilterKey } from "@/lib/subtask-presets/subtask-preset-list-params";

export type SubtaskPresetListPageResult = {
  presets: SubTaskPreset[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

const loadSubtaskPresetListPageCached = cache(
  async (
    _filterKey: string,
    page: number,
    filters: SubtaskPresetListFilters,
  ): Promise<SubtaskPresetListPageResult> => {
    const resolvedPage = Math.max(1, page);
    const { items, total } = await listSubTaskPresetsPaged({
      page: resolvedPage,
      pageSize: SUBTASK_PRESET_LIST_PAGE_SIZE,
      sort: { column: filters.column, direction: filters.direction },
    });
    const pageCount = Math.max(
      1,
      Math.ceil(total / SUBTASK_PRESET_LIST_PAGE_SIZE),
    );
    return {
      presets: items,
      page: resolvedPage,
      pageCount,
      hasMore: resolvedPage < pageCount,
    };
  },
);

/**
 * Loads one page of subtask presets from Drizzle.
 * Deduped per request via React.cache keyed by filterKey + page.
 */
export async function loadSubtaskPresetListPage(
  filters: SubtaskPresetListFilters,
  page: number,
): Promise<SubtaskPresetListPageResult> {
  return loadSubtaskPresetListPageCached(
    subtaskPresetListFilterKey(filters),
    page,
    filters,
  );
}
