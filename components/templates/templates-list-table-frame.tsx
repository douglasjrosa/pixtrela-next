"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  bulkArchiveTemplates,
  bulkDeleteTemplates,
  loadMoreTemplates,
} from "@/app/(app)/templates/template-task-actions";
import { ListLoadMore } from "@/components/ui/load-more-button";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import {
  areAllSelectedTemplatesArchived,
  areAllTemplatesSelected,
  selectedTemplatesFromList,
  toggleIdInSet,
  toggleSelectAllTemplates,
} from "@/lib/business/template-list-selection";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import { templateListFilterKey } from "@/lib/templates/template-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import {
  TemplateListRowPresentational,
  type TemplateListRowLabels,
} from "./template-list-row-presentational";
import type { TemplateListRow } from "./types";

export interface TemplatesListTableFrameProps {
  filters: TemplateListFilters;
  initialTemplates: TemplateListRow[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

function buildRowLabels(
  template: TemplateListRow,
  tTemplates: ReturnType<typeof useTranslations<"templates">>,
  tCommon: ReturnType<typeof useTranslations<"common">>,
): TemplateListRowLabels {
  return {
    subTaskCountShort: tTemplates("subTaskCountShort", {
      count: template.subTaskCount,
    }),
    inactive: tTemplates("inactive"),
    selectRow: tCommon("selectRow", { name: template.name }),
  };
}

export function TemplatesListTableFrame({
  filters,
  initialTemplates,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
  tableBody,
  mobileList,
}: TemplatesListTableFrameProps) {
  const tTemplates = useTranslations("templates");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = templateListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraTemplates, setExtraTemplates] = useState<TemplateListRow[]>([]);
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
    initialTemplates.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraTemplates([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const templates = [...initialTemplates, ...extraTemplates];
  const selectedTemplates = selectedTemplatesFromList(templates, selectedIds);
  const hasSelection = selectedTemplates.length > 0;
  const allSelectedArchived =
    areAllSelectedTemplatesArchived(selectedTemplates);
  const showArchiveAction =
    hasSelection && !allSelectedArchived && canDeactivate;
  const showDeleteAction = hasSelection && allSelectedArchived && canDelete;

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreTemplates(filters, nextPage);
        setExtraTemplates((current) => [...current, ...result.templates]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTemplates("error"));
      }
    });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) =>
      toggleSelectAllTemplates(templates, current),
    );
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleArchiveConfirm(): void {
    startTransition(async () => {
      try {
        await bulkArchiveTemplates(selectedIds);
        showSuccessToast(tTemplates("bulkArchived"));
        setArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTemplates("error"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteTemplates(selectedIds);
        showSuccessToast(tTemplates("bulkDeleted"));
        setDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTemplates("error"));
      }
    });
  }

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllTemplatesSelected(templates, selectedIds),
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
            archiveLabel={tTemplates("archiveSelected")}
            deleteLabel={tTemplates("deleteSelected")}
            disabled={isPending}
            onArchive={() => setArchiveOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="hidden w-full text-sm md:table">
            {tableHeader}
            {tableBody}
            {extraTemplates.length > 0 ? (
              <tbody>
                {extraTemplates.map((template) => (
                  <TemplateListRowPresentational
                    key={template.documentId}
                    template={template}
                    variant="table"
                    href={`/templates/tasks/${template.documentId}`}
                    labels={buildRowLabels(template, tTemplates, tCommon)}
                    showCheckboxColumn={showCheckboxColumn}
                  />
                ))}
              </tbody>
            ) : null}
          </table>

          {mobileList}

          {extraTemplates.length > 0 ? (
            <ul className="md:hidden">
              {extraTemplates.map((template) => (
                <TemplateListRowPresentational
                  key={template.documentId}
                  template={template}
                  variant="mobile"
                  href={`/templates/tasks/${template.documentId}`}
                  labels={buildRowLabels(template, tTemplates, tCommon)}
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

        <ConfirmDialog
          open={archiveOpen}
          title={tTemplates("bulkArchiveTitle")}
          description={tTemplates.rich("bulkArchiveConfirm", {
            count: selectedTemplates.length,
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
          title={tTemplates("bulkDeleteTitle")}
          description={tTemplates("bulkDeleteConfirm")}
          confirmLabel={tCommon("delete")}
          disabled={isPending}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
        />
      </div>
    </ListSelectionProvider>
  );
}
