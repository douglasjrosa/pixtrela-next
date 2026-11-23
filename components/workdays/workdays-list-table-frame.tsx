"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  bulkArchiveWorkdays,
  bulkDeleteWorkdays,
  bulkReactivateWorkdays,
  loadMoreWorkdays,
} from "@/app/(app)/workdays/actions";
import { ArchiveReasonModal } from "@/components/ui/archive-reason-modal";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListPageActionsPortal } from "@/components/ui/list-page-actions-slot";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import { ListLoadMore } from "@/components/ui/load-more-button";
import {
  areAllSelectedWorkdaysArchived,
  areAllWorkdaysSelected,
  selectedWorkdaysFromList,
  toggleIdInSet,
  toggleSelectAllWorkdays,
} from "@/lib/business/workday-list-selection";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { WorkdayListFilters } from "@/lib/schemas/workday-list-filters";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { buildWorkdayRowLabels } from "@/lib/workdays/format-workday-row-labels";
import { workdayListFilterKey } from "@/lib/workdays/workday-list-params";

import { WorkdayListRowPresentational } from "./workday-list-row-presentational";
import type { WorkdayRow } from "./types";

export interface WorkdaysListTableFrameProps {
  filters: WorkdayListFilters;
  initialWorkdays: WorkdayRow[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function WorkdaysListTableFrame({
  filters,
  initialWorkdays,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
  tableBody,
  mobileList,
}: WorkdaysListTableFrameProps) {
  const t = useTranslations("workdays");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = workdayListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraWorkdays, setExtraWorkdays] = useState<WorkdayRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const listResetKey = [
    filterKey,
    String(initialPage),
    String(initialHasMore),
    initialWorkdays.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraWorkdays([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const workdays = [...initialWorkdays, ...extraWorkdays];
  const selectedWorkdays = selectedWorkdaysFromList(workdays, selectedIds);
  const hasSelection = selectedWorkdays.length > 0;
  const allSelectedArchived = areAllSelectedWorkdaysArchived(selectedWorkdays);
  const showArchiveAction =
    hasSelection && !allSelectedArchived && canDeactivate;
  const showDeleteAction = hasSelection && allSelectedArchived && canDelete;
  const showRestoreAction =
    hasSelection && allSelectedArchived && canDeactivate;

  function labelsFor(workday: WorkdayRow) {
    return buildWorkdayRowLabels(
      workday,
      (key, values) => t(key, values),
      (key, values) => tCommon(key, values),
    );
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreWorkdays(filters, nextPage);
        setExtraWorkdays((current) => [...current, ...result.workdays]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) => toggleSelectAllWorkdays(workdays, current));
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleArchiveConfirm(reason: string): void {
    startTransition(async () => {
      try {
        await bulkArchiveWorkdays(selectedIds, reason);
        showSuccessToast(t("bulkArchived"));
        setArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteWorkdays(selectedIds);
        showSuccessToast(t("bulkDeleted"));
        setDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  function handleRestoreSelected(): void {
    startTransition(async () => {
      try {
        await bulkReactivateWorkdays(selectedIds);
        showSuccessToast(t("bulkReactivated"));
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllWorkdaysSelected(workdays, selectedIds),
        onToggleSelect: handleToggleSelect,
        onToggleSelectAll: handleToggleSelectAll,
      }
    : null;

  return (
    <ListSelectionProvider value={selectionValue}>
      <div className="flex min-h-0 flex-1 flex-col">
        {bulkEnabled &&
        (showArchiveAction || showRestoreAction || showDeleteAction) ? (
          <ListPageActionsPortal>
            <BulkListToolbar
              showArchive={showArchiveAction}
              showRestore={showRestoreAction}
              showDelete={showDeleteAction}
              archiveLabel={t("archiveSelected")}
              restoreLabel={t("restoreSelected")}
              deleteLabel={t("deleteSelected")}
              disabled={isPending}
              onArchive={() => setArchiveOpen(true)}
              onRestore={handleRestoreSelected}
              onDelete={() => setDeleteOpen(true)}
            />
          </ListPageActionsPortal>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="hidden w-full text-sm md:table">
            {tableHeader}
            {tableBody}
            {extraWorkdays.length > 0 ? (
              <tbody>
                {extraWorkdays.map((workday) => (
                  <WorkdayListRowPresentational
                    key={workday.documentId}
                    workday={workday}
                    variant="table"
                    labels={labelsFor(workday)}
                    showCheckboxColumn={showCheckboxColumn}
                  />
                ))}
              </tbody>
            ) : null}
          </table>

          {mobileList}

          {extraWorkdays.length > 0 ? (
            <ul className="md:hidden">
              {extraWorkdays.map((workday) => (
                <WorkdayListRowPresentational
                  key={workday.documentId}
                  workday={workday}
                  variant="mobile"
                  labels={labelsFor(workday)}
                  showCheckboxColumn={showCheckboxColumn}
                />
              ))}
            </ul>
          ) : null}
        </div>

        <ListLoadMore
          visible={hasMore}
          loading={isPending}
          onClick={handleLoadMore}
        />

        <ArchiveReasonModal
          open={archiveOpen}
          title={t("bulkArchiveTitle")}
          description={t.rich("bulkArchiveConfirm", {
            count: selectedWorkdays.length,
            b: (chunks) => <b>{chunks}</b>,
          })}
          count={selectedIds.length}
          disabled={isPending}
          titleId="workdays-bulk-archive-title"
          onConfirm={handleArchiveConfirm}
          onClose={() => setArchiveOpen(false)}
        />

        <ConfirmDialog
          open={deleteOpen}
          title={t("bulkDeleteTitle")}
          description={t("bulkDeleteConfirm")}
          confirmVariant="destructive"
          disabled={isPending}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
        />
      </div>
    </ListSelectionProvider>
  );
}
