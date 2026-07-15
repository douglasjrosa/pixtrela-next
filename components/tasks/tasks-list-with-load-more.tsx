"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { loadMoreTasks } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import { taskListFilterKey } from "@/lib/tasks/task-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast } from "@/lib/ui/app-toast";

import type { TaskRow } from "./types";
import { TasksListView } from "./tasks-list-view";

export interface TasksListWithLoadMoreProps {
  filters: TaskListFilters;
  initialTasks: TaskRow[];
  initialHasMore: boolean;
  initialPage: number;
}

export function TasksListWithLoadMore({
  filters,
  initialTasks,
  initialHasMore,
  initialPage,
}: TasksListWithLoadMoreProps) {
  const tManage = useTranslations("tasks.manage");
  const filterKey = taskListFilterKey(filters);
  const [extraTasks, setExtraTasks] = useState<TaskRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setExtraTasks([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
  }, [filterKey, initialTasks, initialPage, initialHasMore]);

  const tasks = [...initialTasks, ...extraTasks];

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreTasks(filters, nextPage);
        setExtraTasks((current) => [...current, ...result.tasks]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TasksListView tasks={tasks} />
      </div>
      {hasMore ? (
        <div className="shrink-0 pt-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleLoadMore}
          >
            {isPending ? tManage("loadingMore") : tManage("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
