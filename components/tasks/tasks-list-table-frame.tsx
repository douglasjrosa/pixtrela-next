"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  bulkDeactivateTasks,
  bulkDeleteTasks,
  loadMoreTasks,
} from "@/app/(app)/tasks/actions";
import { LoadMoreButton, LoadMoreButtonRow } from "@/components/ui/load-more-button";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  areAllSelectedTasksArchived,
  areAllTasksSelected,
  selectedTasksFromList,
  toggleIdInSet,
  toggleSelectAllTasks,
} from "@/lib/business/task-list-selection";
import { formatSpentOfExpected } from "@/lib/format/spent-of-expected";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import { taskListFilterKey } from "@/lib/tasks/task-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import {
  TaskListRowPresentational,
  type TaskListRowLabels,
} from "./task-list-row-presentational";
import { TaskListSelectionProvider } from "./task-list-selection-context";
import { TasksBulkArchiveModal } from "./tasks-bulk-archive-modal";
import type { TaskRow } from "./types";

export interface TasksListTableFrameProps {
  filters: TaskListFilters;
  initialTasks: TaskRow[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

function buildRowLabels(
  task: TaskRow,
  tManage: ReturnType<typeof useTranslations<"tasks.manage">>,
  tStatus: ReturnType<typeof useTranslations<"tasks.status">>,
  tDuration: ReturnType<typeof useTranslations<"duration">>,
  tCommon: ReturnType<typeof useTranslations<"common">>,
): TaskListRowLabels {
  return {
    inactive: tManage("inactive"),
    status: tStatus(task.status),
    spentOfExpected: formatSpentOfExpected(
      task.totalTimeSpent,
      task.totalExpectedTime,
      (key, values) => tDuration(key, values),
      (spent, expected) => tManage("spentOfExpected", { spent, expected }),
    ),
    finishedSubTasks: tManage("finishedSubTasksValue", {
      finished: task.finishedSubTaskCount,
      total: task.totalSubTaskCount,
    }),
    qtyShort: tManage("qtyShort", { qty: task.qty }),
    selectRow: tCommon("selectRow", { name: task.name }),
  };
}

export function TasksListTableFrame({
  filters,
  initialTasks,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
  tableBody,
  mobileList,
}: TasksListTableFrameProps) {
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const tDuration = useTranslations("duration");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = taskListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraTasks, setExtraTasks] = useState<TaskRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const listResetKey = `${filterKey}:${initialPage}:${initialHasMore}`;
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraTasks([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const tasks = [...initialTasks, ...extraTasks];
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

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllTasksSelected(tasks, selectedIds),
        onToggleSelect: handleToggleSelect,
        onToggleSelectAll: handleToggleSelectAll,
      }
    : null;

  return (
    <TaskListSelectionProvider value={selectionValue}>
      <div className="flex min-h-0 flex-1 flex-col">
        {bulkEnabled ? (
          <div className="flex h-10 shrink-0 items-center justify-end gap-2">
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
          <table className="hidden w-full text-sm md:table">
            {tableHeader}
            {tableBody}
            {extraTasks.length > 0 ? (
              <tbody>
                {extraTasks.map((task) => (
                  <TaskListRowPresentational
                    key={task.documentId}
                    task={task}
                    variant="table"
                    href={`/tasks/${task.documentId}`}
                    labels={buildRowLabels(
                      task,
                      tManage,
                      tStatus,
                      tDuration,
                      tCommon,
                    )}
                    showCheckboxColumn={showCheckboxColumn}
                  />
                ))}
              </tbody>
            ) : null}
          </table>

          {mobileList}

          {extraTasks.length > 0 ? (
            <ul className="md:hidden">
              {extraTasks.map((task) => (
                <TaskListRowPresentational
                  key={task.documentId}
                  task={task}
                  variant="mobile"
                  href={`/tasks/${task.documentId}`}
                  labels={buildRowLabels(
                    task,
                    tManage,
                    tStatus,
                    tDuration,
                    tCommon,
                  )}
                  showCheckboxColumn={showCheckboxColumn}
                />
              ))}
            </ul>
          ) : null}
        </div>

        {hasMore ? (
          <LoadMoreButtonRow>
            <LoadMoreButton
              loading={isPending}
              label={tManage("loadMore")}
              loadingLabel={tManage("loadingMore")}
              onClick={handleLoadMore}
            />
          </LoadMoreButtonRow>
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
    </TaskListSelectionProvider>
  );
}
