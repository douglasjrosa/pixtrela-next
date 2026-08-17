import { getTranslations } from "next-intl/server";

import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import type { TaskListSort } from "@/lib/schemas/task-list-sort";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";

import { TasksListMobileList } from "./tasks-list-mobile-list";
import { TasksListTableBody } from "./tasks-list-table-body";
import { TasksListTableHeader } from "./tasks-list-table-header";
import type { TaskRow } from "./types";

export interface TasksListViewProps {
  tasks: TaskRow[];
  sort: TaskListSort;
  filters: TaskListFilters;
  showCheckboxColumn?: boolean;
}

/** Server list sections for composition inside TasksListTableFrame. */
export async function TasksListView({
  tasks,
  sort,
  filters,
  showCheckboxColumn = false,
}: TasksListViewProps) {
  const tManage = await getTranslations("tasks.manage");

  if (tasks.length === 0) {
    return <ListEmptyMessage>{tManage("empty")}</ListEmptyMessage>;
  }

  return (
    <>
      <TasksListTableHeader
        sort={sort}
        filters={filters}
        showCheckboxColumn={showCheckboxColumn}
      />
      <TasksListTableBody
        tasks={tasks}
        showCheckboxColumn={showCheckboxColumn}
      />
      <TasksListMobileList
        tasks={tasks}
        showCheckboxColumn={showCheckboxColumn}
      />
    </>
  );
}
