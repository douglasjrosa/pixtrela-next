import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { SubtaskPresetListSort } from "@/lib/schemas/subtask-preset-list-sort";
import type { SubtaskPresetListFilters } from "@/lib/schemas/subtask-preset-list-filters";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { SubtaskPresetListSortHeaderLink } from "./subtask-preset-list-sort-header-link";

export interface SubtaskPresetListTableHeaderProps {
  sort: SubtaskPresetListSort;
  filters: SubtaskPresetListFilters;
  showCheckboxColumn?: boolean;
}

export async function SubtaskPresetListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: SubtaskPresetListTableHeaderProps) {
  const tSubtasks = await getTranslations("subtasks");
  const tCommon = await getTranslations("common");

  return (
    <thead>
      <tr className="border-b text-left">
        {showCheckboxColumn ? (
          <th className={cn("w-10 py-2", "text-center")}>
            <ListRowCheckbox
              documentId=""
              variant="table-header"
              selectAll
              ariaLabel={tCommon("selectAll")}
            />
          </th>
        ) : null}
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
          column="actionName"
          label={tSubtasks("action")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
