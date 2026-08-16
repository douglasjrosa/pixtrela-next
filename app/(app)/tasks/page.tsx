import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { TasksListSkeleton } from "@/components/tasks/tasks-list-skeleton";
import { TasksListMobileList } from "@/components/tasks/tasks-list-mobile-list";
import { TasksListTableBody } from "@/components/tasks/tasks-list-table-body";
import { TasksListTableFrame } from "@/components/tasks/tasks-list-table-frame";
import { TasksListTableHeader } from "@/components/tasks/tasks-list-table-header";
import { TasksPageHeader } from "@/components/tasks/tasks-page-header";
import { TasksRevisionRefresh } from "@/components/tasks/tasks-revision-refresh";
import { TasksToolbar } from "@/components/tasks/tasks-toolbar";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import type { StepOption } from "@/components/tasks/types";
import {
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_STACK_CLASS,
} from "@/components/layout/app-page-layout";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTasks,
  canDeleteTasks,
  canManageTasks,
} from "@/lib/auth/permissions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import { loadTaskListPage } from "@/lib/tasks/load-task-list-page";
import {
  parseTaskListSearchParams,
  parseTaskListSelectMode,
  taskListFilterKey,
} from "@/lib/tasks/task-list-params";

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function loadSteps(): Promise<StepOption[]> {
  const rows = await listStepsRepo();
  return rows.map((step) => ({
    documentId: step.id,
    name: step.name,
  }));
}

async function TasksListSection({
  filters,
  selectMode,
  canDeactivate,
  canDelete,
}: {
  filters: TaskListFilters;
  selectMode: boolean;
  canDeactivate: boolean;
  canDelete: boolean;
}) {
  const tManage = await getTranslations("tasks.manage");
  let pageResult: Awaited<ReturnType<typeof loadTaskListPage>> = {
    tasks: [],
    page: 1,
    pageCount: 1,
    hasMore: false,
  };

  try {
    pageResult = await loadTaskListPage(filters, 1);
  } catch (error) {
    rethrowIfNavigationError(error);
  }

  if (pageResult.tasks.length === 0) {
    return <ListEmptyMessage>{tManage("empty")}</ListEmptyMessage>;
  }

  const bulkEnabled = canDeactivate || canDelete;
  const selectionEnabled = selectMode && bulkEnabled;
  const sort = { column: filters.column, direction: filters.direction };

  return (
    <TasksListTableFrame
      filters={filters}
      initialTasks={pageResult.tasks}
      initialPage={pageResult.page}
      initialHasMore={pageResult.hasMore}
      selectMode={selectMode}
      canDeactivate={canDeactivate}
      canDelete={canDelete}
      tableHeader={
        <TasksListTableHeader
          sort={sort}
          filters={filters}
          selectionEnabled={selectionEnabled}
          selectMode={selectMode}
        />
      }
      tableBody={
        <TasksListTableBody
          tasks={pageResult.tasks}
          selectionEnabled={selectionEnabled}
        />
      }
      mobileList={
        <TasksListMobileList
          tasks={pageResult.tasks}
          selectionEnabled={selectionEnabled}
        />
      }
    />
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTasks(role)) {
    return <ForbiddenMessage />;
  }

  const params = await searchParams;
  const filters = parseTaskListSearchParams(params);
  const selectMode = parseTaskListSelectMode(params);
  const filterKey = taskListFilterKey(filters);
  const steps = await loadSteps();
  const canDeactivate = canDeactivateTasks(role);
  const canDelete = canDeleteTasks(role);

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <TasksRevisionRefresh />
      <div className={APP_LIST_PAGE_STACK_CLASS}>
        <TasksPageHeader steps={steps} />
        <Suspense fallback={null}>
          <TasksToolbar />
        </Suspense>
        <Suspense key={filterKey} fallback={<TasksListSkeleton />}>
          <TasksListSection
            filters={filters}
            selectMode={selectMode}
            canDeactivate={canDeactivate}
            canDelete={canDelete}
          />
        </Suspense>
      </div>
    </section>
  );
}
