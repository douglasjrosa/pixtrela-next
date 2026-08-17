import { getTranslations } from "next-intl/server";

import type { SubtaskPresetListSort } from "@/lib/schemas/subtask-preset-list-sort";
import type { SubtaskPresetListFilters } from "@/lib/schemas/subtask-preset-list-filters";

import { SubtaskPresetListSortHeaderLink } from "./subtask-preset-list-sort-header-link";

export interface SubtaskPresetListTableHeaderProps {
  sort: SubtaskPresetListSort;
  filters: SubtaskPresetListFilters;
}

export async function SubtaskPresetListTableHeader({
  sort,
  filters,
}: SubtaskPresetListTableHeaderProps) {
  const tSubtasks = await getTranslations("subtasks");

  return (
    <thead>
      <tr className="border-b text-left">
        <SubtaskPresetListSortHeaderLink
          column="name"
          label={tSubtasks("name")}
          sort={sort}
          filters={filters}
          align="left"
        />
        <SubtaskPresetListSortHeaderLink
          column="sharingType"
          label={tSubtasks("sharingTypeLabel")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <SubtaskPresetListSortHeaderLink
          column="expectedTime"
          label={tSubtasks("expectedTime")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
