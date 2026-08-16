import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { TaskListSort } from "@/lib/schemas/task-list-sort";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";

import { TaskListRowCheckbox } from "./task-list-row-checkbox";
import { TaskListSortHeaderLink } from "./task-list-sort-header-link";

export interface TasksListTableHeaderProps {
  sort: TaskListSort;
  filters: TaskListFilters;
  selectionEnabled?: boolean;
  selectMode?: boolean;
}

export async function TasksListTableHeader({
  sort,
  filters,
  selectionEnabled = false,
  selectMode = false,
}: TasksListTableHeaderProps) {
  const tManage = await getTranslations("tasks.manage");
  const tCommon = await getTranslations("common");

  return (
    <thead>
      <tr className="border-b text-left">
        {selectionEnabled ? (
          <th className={cn("w-10 py-2", "text-center")}>
            <div className="flex justify-center">
              <TaskListRowCheckbox
                documentId=""
                variant="table"
                selectAll
                ariaLabel={tCommon("selectAll")}
              />
            </div>
          </th>
        ) : null}
        <TaskListSortHeaderLink
          column="name"
          label={tManage("name")}
          sort={sort}
          filters={filters}
          selectMode={selectMode}
          align="left"
        />
        <TaskListSortHeaderLink
          column="qty"
          label={tManage("qty")}
          sort={sort}
          filters={filters}
          selectMode={selectMode}
          align="center"
        />
        <TaskListSortHeaderLink
          column="deliveryDate"
          label={tManage("deliveryDate")}
          sort={sort}
          filters={filters}
          selectMode={selectMode}
          align="center"
        />
        <TaskListSortHeaderLink
          column="totalTimeSpent"
          label={tManage("totalTimeSpent")}
          sort={sort}
          filters={filters}
          selectMode={selectMode}
          align="center"
        />
        <TaskListSortHeaderLink
          column="finishedSubTasks"
          label={tManage("finishedSubTasks")}
          sort={sort}
          filters={filters}
          selectMode={selectMode}
          align="center"
        />
        <TaskListSortHeaderLink
          column="status"
          label={tManage("status")}
          sort={sort}
          filters={filters}
          selectMode={selectMode}
          align="center"
        />
      </tr>
    </thead>
  );
}
