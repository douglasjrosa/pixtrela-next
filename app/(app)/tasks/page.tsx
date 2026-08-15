import { Suspense } from "react";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { TasksListSkeleton } from "@/components/tasks/tasks-list-skeleton";
import { TasksListWithLoadMore } from "@/components/tasks/tasks-list-with-load-more";
import { TasksPageHeader } from "@/components/tasks/tasks-page-header";
import { TasksToolbar } from "@/components/tasks/tasks-toolbar";
import type { StepOption } from "@/components/tasks/types";
import {
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_STACK_CLASS,
} from "@/components/layout/app-page-layout";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks } from "@/lib/auth/permissions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import { loadTaskListPage } from "@/lib/tasks/load-task-list-page";
import {
  parseTaskListSearchParams,
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
}: {
  filters: TaskListFilters;
}) {
  let initialTasks: Awaited<
    ReturnType<typeof loadTaskListPage>
  >["tasks"] = [];
  let initialHasMore = false;
  let initialPage = 1;

  try {
    const page = await loadTaskListPage(filters, 1);
    initialTasks = page.tasks;
    initialHasMore = page.hasMore;
    initialPage = page.page;
  } catch (error) {
    rethrowIfNavigationError(error);
  }

  return (
    <TasksListWithLoadMore
      filters={filters}
      initialTasks={initialTasks}
      initialHasMore={initialHasMore}
      initialPage={initialPage}
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
  const filterKey = taskListFilterKey(filters);
  const steps = await loadSteps();

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <div className={APP_LIST_PAGE_STACK_CLASS}>
        <TasksPageHeader steps={steps} />
        <Suspense fallback={null}>
          <TasksToolbar />
        </Suspense>
        <Suspense key={filterKey} fallback={<TasksListSkeleton />}>
          <TasksListSection filters={filters} />
        </Suspense>
      </div>
    </section>
  );
}
