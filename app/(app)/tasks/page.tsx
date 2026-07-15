import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { TasksListSkeleton } from "@/components/tasks/tasks-list-skeleton";
import { TasksListWithLoadMore } from "@/components/tasks/tasks-list-with-load-more";
import { TASKS_PAGE_HEIGHT_CLASS } from "@/components/tasks/tasks-page-layout";
import { TasksPageHeader } from "@/components/tasks/tasks-page-header";
import { TasksToolbar } from "@/components/tasks/tasks-toolbar";
import type { StepOption } from "@/components/tasks/types";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks } from "@/lib/auth/permissions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { loadTaskListPage } from "@/lib/tasks/load-task-list-page";
import {
  parseTaskListSearchParams,
  taskListFilterKey,
} from "@/lib/tasks/task-list-params";

interface StrapiList<T> {
  data: T[];
}

interface StepEntity {
  documentId: string;
  name: string;
}

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function loadSteps(): Promise<StepOption[]> {
  try {
    const res = await strapiFetch<StrapiList<StepEntity>>(
      "/steps",
      { strapiCache: { tags: [STRAPI_TAGS.steps], revalidate: 60 } },
      { fields: ["documentId", "name"], sort: "index:asc" },
    );
    return res.data.map((step) => ({
      documentId: step.documentId,
      name: step.name,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function TasksListSection({
  filters,
}: {
  filters: TaskListFilters;
}) {
  try {
    const page = await loadTaskListPage(filters, 1);
    return (
      <TasksListWithLoadMore
        filters={filters}
        initialTasks={page.tasks}
        initialHasMore={page.hasMore}
        initialPage={page.page}
      />
    );
  } catch (error) {
    rethrowIfNavigationError(error);
    return (
      <TasksListWithLoadMore
        filters={filters}
        initialTasks={[]}
        initialHasMore={false}
        initialPage={1}
      />
    );
  }
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const t = await getTranslations("errors");
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTasks(role)) {
    return (
      <section className="p-6">
        <p className="text-destructive">{t("forbidden")}</p>
      </section>
    );
  }

  const params = await searchParams;
  const filters = parseTaskListSearchParams(params);
  const filterKey = taskListFilterKey(filters);
  const steps = await loadSteps();

  return (
    <section className={`flex ${TASKS_PAGE_HEIGHT_CLASS} flex-col gap-4 p-6`}>
      <TasksPageHeader steps={steps} />
      <Suspense fallback={null}>
        <TasksToolbar />
      </Suspense>
      <Suspense key={filterKey} fallback={<TasksListSkeleton />}>
        <TasksListSection filters={filters} />
      </Suspense>
    </section>
  );
}
