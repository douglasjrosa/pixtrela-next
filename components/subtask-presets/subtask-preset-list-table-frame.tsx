"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  bulkArchiveSubTaskPresets,
  bulkDeleteSubTaskPresets,
  loadMoreSubTaskPresets,
} from "@/app/(app)/sub-task-presets/actions";
import { ListLoadMore } from "@/components/ui/load-more-button";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import {
  areAllSelectedSubtaskPresetsArchived,
  areAllSubtaskPresetsSelected,
  selectedSubtaskPresetsFromList,
  toggleIdInSet,
  toggleSelectAllSubtaskPresets,
} from "@/lib/business/subtask-preset-list-selection";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { SubtaskPresetListFilters } from "@/lib/schemas/subtask-preset-list-filters";
import { subtaskPresetListFilterKey } from "@/lib/subtask-presets/subtask-preset-list-params";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import {
  SubtaskPresetListRowPresentational,
  type SubtaskPresetListRowLabels,
} from "./subtask-preset-list-row-presentational";

export interface SubtaskPresetListTableFrameProps {
  filters: SubtaskPresetListFilters;
  initialPresets: SubTaskPreset[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
}

export function SubtaskPresetListTableFrame({
  filters,
  initialPresets,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
}: SubtaskPresetListTableFrameProps) {
  const tPresets = useTranslations("subTaskPresets");
  const tTemplates = useTranslations("templates");
  const tCommon = useTranslations("common");
  const tSharing = useTranslations("subtasks.sharingType");
  const router = useRouter();
  const filterKey = subtaskPresetListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraPresets, setExtraPresets] = useState<SubTaskPreset[]>([]);
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
    initialPresets.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraPresets([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const presets = [...initialPresets, ...extraPresets];
  const selectedPresets = selectedSubtaskPresetsFromList(presets, selectedIds);
  const hasSelection = selectedPresets.length > 0;
  const allSelectedArchived =
    areAllSelectedSubtaskPresetsArchived(selectedPresets);
  const showArchiveAction =
    hasSelection && !allSelectedArchived && canDeactivate;
  const showDeleteAction = hasSelection && allSelectedArchived && canDelete;

  function labelsFor(preset: SubTaskPreset): SubtaskPresetListRowLabels {
    return {
      sharingType: tSharing(preset.sharingType),
      actionName: preset.actionName,
      inactive: tTemplates("inactive"),
      selectRow: tCommon("selectRow", { name: preset.name }),
    };
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreSubTaskPresets(filters, nextPage);
        setExtraPresets((current) => [...current, ...result.presets]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPresets("error"));
      }
    });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) =>
      toggleSelectAllSubtaskPresets(presets, current),
    );
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleArchiveConfirm(): void {
    startTransition(async () => {
      try {
        await bulkArchiveSubTaskPresets(selectedIds);
        showSuccessToast(tPresets("bulkArchived"));
        setArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPresets("error"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteSubTaskPresets(selectedIds);
        showSuccessToast(tPresets("bulkDeleted"));
        setDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPresets("error"));
      }
    });
  }

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllSubtaskPresetsSelected(presets, selectedIds),
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
            archiveLabel={tPresets("archiveSelected")}
            deleteLabel={tPresets("deleteSelected")}
            disabled={isPending}
            onArchive={() => setArchiveOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="hidden w-full text-sm md:table">
            {tableHeader}
            <tbody>
              {presets.map((preset) => (
                <SubtaskPresetListRowPresentational
                  key={preset.documentId}
                  preset={preset}
                  variant="table"
                  labels={labelsFor(preset)}
                  showCheckboxColumn={showCheckboxColumn}
                />
              ))}
            </tbody>
          </table>

          <ul className="md:hidden">
            {presets.map((preset) => (
              <SubtaskPresetListRowPresentational
                key={preset.documentId}
                preset={preset}
                variant="mobile"
                labels={labelsFor(preset)}
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
          title={tPresets("bulkArchiveTitle")}
          description={tPresets.rich("bulkArchiveConfirm", {
            count: selectedPresets.length,
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
          title={tPresets("bulkDeleteTitle")}
          description={tPresets("bulkDeleteConfirm")}
          confirmLabel={tCommon("delete")}
          disabled={isPending}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
        />
      </div>
    </ListSelectionProvider>
  );
}
