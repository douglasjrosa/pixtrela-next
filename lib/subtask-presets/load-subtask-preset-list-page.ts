import { unstable_cache } from "next/cache";

import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { listSubTaskPresetsPaged } from "@/lib/repos/sub-task-presets";
import {
  SUBTASK_PRESET_LIST_PAGE_SIZE,
  type SubtaskPresetListFilters,
} from "@/lib/schemas/subtask-preset-list-filters";
import { subtaskPresetListFilterKey } from "@/lib/subtask-presets/subtask-preset-list-params";

export const SUBTASK_PRESET_LIST_CACHE_TAG = "drizzle:sub-task-presets";

export type SubtaskPresetListPageResult = {
  presets: SubTaskPreset[];
  page: number;
  pageCount: number;
  hasMore: boolean;
};

async function loadSubtaskPresetListPageImpl(
  filters: SubtaskPresetListFilters,
  page: number,
): Promise<SubtaskPresetListPageResult> {
  const resolvedPage = Math.max(1, page);
  const { items, total } = await listSubTaskPresetsPaged({
    q: filters.q,
    showArchived: filters.showArchived,
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
}

/**
 * Loads one page of subtask presets from Drizzle.
 * Cached with `SUBTASK_PRESET_LIST_CACHE_TAG` for mutation invalidation.
 */
export async function loadSubtaskPresetListPage(
  filters: SubtaskPresetListFilters,
  page: number,
): Promise<SubtaskPresetListPageResult> {
  const filterKey = subtaskPresetListFilterKey(filters);
  const resolvedPage = Math.max(1, page);
  const cached = unstable_cache(
    async () => loadSubtaskPresetListPageImpl(filters, resolvedPage),
    ["subtask-preset-list-page", filterKey, String(resolvedPage)],
    { tags: [SUBTASK_PRESET_LIST_CACHE_TAG] },
  );
  return cached();
}
