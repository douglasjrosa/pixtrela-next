import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { TaskListSort } from "@/lib/schemas/task-list-sort";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { TaskListSortHeaderLink } from "./task-list-sort-header-link";

export interface TasksListTableHeaderProps {
  sort: TaskListSort;
  filters: TaskListFilters;
  showCheckboxColumn?: boolean;
}

export async function TasksListTableHeader({
  sort,
  filters,
  showCheckboxColumn = false,
}: TasksListTableHeaderProps) {
  const tManage = await getTranslations("tasks.manage");
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
        <TaskListSortHeaderLink
          column="crmItemKey"
          label={tManage("crmItemKey")}
          sort={sort}
          filters={filters}
          align="left"
        />
        <TaskListSortHeaderLink
          column="name"
          label={tManage("name")}
          sort={sort}
          filters={filters}
          align="left"
        />
        <TaskListSortHeaderLink
          column="qty"
          label={tManage("qty")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TaskListSortHeaderLink
          column="deliveryDate"
          label={tManage("deliveryDate")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TaskListSortHeaderLink
          column="totalTimeSpent"
          label={tManage("totalTimeSpent")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TaskListSortHeaderLink
          column="finishedSubTasks"
          label={tManage("finishedSubTasks")}
          sort={sort}
          filters={filters}
          align="center"
        />
        <TaskListSortHeaderLink
          column="status"
          label={tManage("status")}
          sort={sort}
          filters={filters}
          align="center"
        />
      </tr>
    </thead>
  );
}
