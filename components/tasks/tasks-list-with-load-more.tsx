"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  bulkDeactivateTasks,
  bulkDeleteTasks,
  loadMoreTasks,
} from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  areAllSelectedTasksArchived,
  areAllTasksSelected,
  selectedTasksFromList,
  toggleIdInSet,
  toggleSelectAllTasks,
} from "@/lib/business/task-list-selection";
import { useTasksRevisionRefresh } from "@/hooks/use-tasks-revision-refresh";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import {
  nextTaskListSort,
  type TaskListSortColumn,
} from "@/lib/schemas/task-list-sort";
import {
  serializeTaskListSearchParams,
  taskListFilterKey,
} from "@/lib/tasks/task-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import type { TaskRow } from "./types";
import { TasksBulkArchiveModal } from "./tasks-bulk-archive-modal";
import { TasksListView } from "./tasks-list-view";

export interface TasksListWithLoadMoreProps {
  filters: TaskListFilters;
  initialTasks: TaskRow[];
  initialHasMore: boolean;
  initialPage: number;
  canDeactivate?: boolean;
  canDelete?: boolean;
}

export function TasksListWithLoadMore({
  filters,
  initialTasks,
  initialHasMore,
  initialPage,
  canDeactivate = false,
  canDelete = false,
}: TasksListWithLoadMoreProps) {
  useTasksRevisionRefresh();

  const tManage = useTranslations("tasks.manage");
  const router = useRouter();
  const filterKey = taskListFilterKey(filters);
  const [extraTasks, setExtraTasks] = useState<TaskRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const listResetKey = `${filterKey}:${initialPage}:${initialHasMore}:${initialTasks}`;
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraTasks([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const tasks = [...initialTasks, ...extraTasks];
  const selectionEnabled = canDeactivate || canDelete;
  const selectedTasks = selectedTasksFromList(tasks, selectedIds);
  const hasSelection = selectedTasks.length > 0;
  const allSelectedArchived = areAllSelectedTasksArchived(selectedTasks);
  const showArchiveAction =
    hasSelection && !allSelectedArchived && canDeactivate;
  const showDeleteAction = hasSelection && allSelectedArchived && canDelete;

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

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) => toggleSelectAllTasks(tasks, current));
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleArchiveConfirm(reasonForDeactivation: string): void {
    startTransition(async () => {
      try {
        await bulkDeactivateTasks(selectedIds, reasonForDeactivation);
        showSuccessToast(tManage("bulkArchived"));
        setArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteTasks(selectedIds);
        showSuccessToast(tManage("bulkDeleted"));
        setDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  function handleSort(column: TaskListSortColumn): void {
    const next = nextTaskListSort(
      { column: filters.column, direction: filters.direction },
      column,
    );
    const params = serializeTaskListSearchParams({
      ...filters,
      column: next.column,
      direction: next.direction,
    });
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/tasks?${query}` : "/tasks");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {selectionEnabled ? (
        <div className="flex h-10 shrink-0 items-center justify-end">
          {showArchiveAction ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={tManage("archiveSelected")}
              disabled={isPending}
              onClick={() => setArchiveOpen(true)}
            >
              <Archive aria-hidden />
            </Button>
          ) : null}
          {showDeleteAction ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={tManage("deleteSelected")}
              disabled={isPending}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TasksListView
          tasks={tasks}
          sort={{ column: filters.column, direction: filters.direction }}
          selectionEnabled={selectionEnabled}
          selectedIds={selectedIds}
          allSelected={areAllTasksSelected(tasks, selectedIds)}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelect={handleToggleSelect}
          onSort={handleSort}
        />
      </div>

      {hasMore ? (
        <div className="flex shrink-0 justify-center pt-3">
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

      <TasksBulkArchiveModal
        open={archiveOpen}
        disabled={isPending}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchiveConfirm}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={tManage("bulkDeleteTitle")}
        description={tManage("bulkDeleteConfirm")}
        confirmLabel={tManage("delete")}
        disabled={isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
