"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  bulkArchiveFactoryActions,
  bulkDeleteFactoryActions,
  loadMoreFactoryActions,
} from "@/app/(app)/factory-actions/actions";
import { ListLoadMore } from "@/components/ui/load-more-button";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import type { FactoryAction } from "@/lib/business/factory-action";
import {
  areAllFactoryActionsSelected,
  areAllSelectedFactoryActionsArchived,
  selectedFactoryActionsFromList,
  toggleIdInSet,
  toggleSelectAllFactoryActions,
} from "@/lib/business/factory-action-list-selection";
import { formatDecimalPtBr } from "@/lib/format/decimal";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { FactoryActionListFilters } from "@/lib/schemas/factory-action-list-filters";
import { factoryActionListFilterKey } from "@/lib/factory-actions/factory-action-list-params";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import {
  FactoryActionListRowPresentational,
  type FactoryActionListRowLabels,
} from "./factory-action-list-row-presentational";

export interface FactoryActionListTableFrameProps {
  filters: FactoryActionListFilters;
  initialActions: FactoryAction[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
}

export function FactoryActionListTableFrame({
  filters,
  initialActions,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
}: FactoryActionListTableFrameProps) {
  const tActions = useTranslations("factoryActions");
  const tTemplates = useTranslations("templates");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = factoryActionListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraActions, setExtraActions] = useState<FactoryAction[]>([]);
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
    initialActions.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraActions([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const actions = [...initialActions, ...extraActions];
  const selectedActions = selectedFactoryActionsFromList(actions, selectedIds);
  const hasSelection = selectedActions.length > 0;
  const allSelectedArchived =
    areAllSelectedFactoryActionsArchived(selectedActions);
  const showArchiveAction =
    hasSelection && !allSelectedArchived && canDeactivate;
  const showDeleteAction = hasSelection && allSelectedArchived && canDelete;

  function labelsFor(action: FactoryAction): FactoryActionListRowLabels {
    return {
      unitTime: formatDecimalPtBr(action.unitTime),
      qtyQuestion: action.qtyQuestion,
      description: action.description,
      inactive: tTemplates("inactive"),
      selectRow: tCommon("selectRow", { name: action.name }),
    };
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreFactoryActions(filters, nextPage);
        setExtraActions((current) => [...current, ...result.actions]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tActions("error"));
      }
    });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) =>
      toggleSelectAllFactoryActions(actions, current),
    );
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleArchiveConfirm(): void {
    startTransition(async () => {
      try {
        await bulkArchiveFactoryActions(selectedIds);
        showSuccessToast(tActions("bulkArchived"));
        setArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tActions("error"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteFactoryActions(selectedIds);
        showSuccessToast(tActions("bulkDeleted"));
        setDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tActions("error"));
      }
    });
  }

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllFactoryActionsSelected(actions, selectedIds),
        onToggleSelect: handleToggleSelect,
        onToggleSelectAll: handleToggleSelectAll,
      }
    : null;

  return (
    <ListSelectionProvider value={selectionValue}>
      <div className="flex min-h-0 flex-1 flex-col">
        {bulkEnabled ? (
          <BulkListToolbar
            showArchive={showArchiveAction}
            showDelete={showDeleteAction}
            archiveLabel={tActions("archiveSelected")}
            deleteLabel={tActions("deleteSelected")}
            disabled={isPending}
            onArchive={() => setArchiveOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="hidden w-full text-sm md:table">
            {tableHeader}
            <tbody>
              {actions.map((action) => (
                <FactoryActionListRowPresentational
                  key={action.documentId}
                  action={action}
                  variant="table"
                  labels={labelsFor(action)}
                  showCheckboxColumn={showCheckboxColumn}
                />
              ))}
            </tbody>
          </table>

          <ul className="md:hidden">
            {actions.map((action) => (
              <FactoryActionListRowPresentational
                key={action.documentId}
                action={action}
                variant="mobile"
                labels={labelsFor(action)}
                showCheckboxColumn={showCheckboxColumn}
              />
            ))}
          </ul>
        </div>

        <ListLoadMore
          visible={hasMore}
          loading={isPending}
          onClick={handleLoadMore}
        />

        <ConfirmDialog
          open={archiveOpen}
          title={tActions("bulkArchiveTitle")}
          description={tActions.rich("bulkArchiveConfirm", {
            count: selectedActions.length,
            b: (chunks) => <b>{chunks}</b>,
          })}
          confirmLabel={tCommon("yes")}
          cancelLabel={tCommon("cancel")}
          confirmVariant="default"
          disabled={isPending}
          onConfirm={handleArchiveConfirm}
          onClose={() => setArchiveOpen(false)}
        />

        <ConfirmDialog
          open={deleteOpen}
          title={tActions("bulkDeleteTitle")}
          description={tActions("bulkDeleteConfirm")}
          confirmLabel={tCommon("delete")}
          disabled={isPending}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
        />
      </div>
    </ListSelectionProvider>
  );
}
