"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  bulkDeleteFlags,
  loadMoreFlags,
} from "@/app/(app)/settings/subtasks/actions";
import { ListLoadMore } from "@/components/ui/load-more-button";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import {
  areAllRowsSelected,
  toggleIdInSet,
  toggleSelectAllRows,
} from "@/lib/business/list-selection";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { MaterialFlagListFilters } from "@/lib/schemas/material-flag";
import { SETTINGS_ENTITY_LIST_PAGE_SIZE } from "@/lib/schemas/sub-task-category";
import { flagListFilterKey } from "@/lib/settings/flag-list-params";
import { settingsSubtaskDeleteErrorKey } from "@/lib/settings/subtask-delete-error";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { TABLE_HEAD_CELL_CLASS } from "@/lib/ui/table-head-styles";

const ROW_LINK_CLASS =
  "text-inherit after:absolute after:inset-0 after:content-['']";

export type FlagListRow = {
  id: string;
  code: string;
  categoryName: string;
  index: number;
  occupied: boolean;
};

function toSelectable(row: FlagListRow) {
  return { documentId: row.id };
}

export function FlagListTableFrame({
  filters,
  initialItems,
  initialHasMore,
}: {
  filters: MaterialFlagListFilters;
  initialItems: FlagListRow[];
  initialHasMore: boolean;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = flagListFilterKey(filters);
  const [extra, setExtra] = useState<FlagListRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setExtra([]);
    setPage(1);
    setHasMore(initialHasMore);
    setSelectedIds([]);
    setRemovedIds([]);
  }
  const items = [...initialItems, ...extra].filter(
    (row) => !removedIds.includes(row.id),
  );
  const selectable = items.map(toSelectable);
  const hasSelection = selectedIds.length > 0;

  async function handleLoadMore(): Promise<void> {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const result = await loadMoreFlags(filters, nextPage);
      setExtra((current) => [...current, ...result.items]);
      setPage(nextPage);
      setHasMore(nextPage * SETTINGS_ENTITY_LIST_PAGE_SIZE < result.total);
    } finally {
      setLoading(false);
    }
  }

  function handleBulkDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteFlags(selectedIds);
        const deleted = new Set(selectedIds);
        setRemovedIds((current) => [...current, ...selectedIds]);
        setExtra((current) => current.filter((row) => !deleted.has(row.id)));
        showSuccessToast(t("flagsBulkDeleted"));
        setDeleteOpen(false);
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t(settingsSubtaskDeleteErrorKey(error)));
      }
    });
  }

  const selectionValue = {
    selectedIds,
    allSelected: areAllRowsSelected(selectable, selectedIds),
    onToggleSelect: (documentId: string) => {
      setSelectedIds((current) => toggleIdInSet(current, documentId));
    },
    onToggleSelectAll: () => {
      setSelectedIds((current) => toggleSelectAllRows(selectable, current));
    },
  };

  return (
    <ListSelectionProvider value={selectionValue}>
      <div className="space-y-4">
        {items.length > 0 ? (
          <BulkListToolbar
            showArchive={false}
            showDelete={hasSelection}
            archiveLabel={t("flagsDeleteSelected")}
            deleteLabel={t("flagsDeleteSelected")}
            disabled={isPending}
            onArchive={() => undefined}
            onDelete={() => setDeleteOpen(true)}
          />
        ) : null}
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="border-b text-left">
              <th className="w-10 py-2 text-center">
                <ListRowCheckbox
                  documentId=""
                  variant="table-header"
                  selectAll
                  ariaLabel={tCommon("selectAll")}
                />
              </th>
              <th className={TABLE_HEAD_CELL_CLASS}>{t("flagCode")}</th>
              <th className={TABLE_HEAD_CELL_CLASS}>{t("flagCategory")}</th>
              <th className={TABLE_HEAD_CELL_CLASS}>{t("flagIndex")}</th>
              <th className={TABLE_HEAD_CELL_CLASS}>{t("flagOccupied")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.id}
                className="relative cursor-pointer border-b hover:bg-muted/40"
              >
                <ListRowCheckbox
                  documentId={row.id}
                  variant="table"
                  ariaLabel={tCommon("selectRow", { name: row.code })}
                />
                <td className="py-3">
                  <Link
                    href={`/settings/subtasks/flags/${row.id}`}
                    className={`font-mono font-medium ${ROW_LINK_CLASS}`}
                    aria-label={row.code}
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="py-3">{row.categoryName}</td>
                <td className="py-3">{row.index}</td>
                <td className="py-3 text-muted-foreground">
                  {row.occupied ? t("flagOccupied") : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="space-y-2 md:hidden">
          {items.map((row) => (
            <li key={row.id} className="flex items-start gap-2">
              <ListRowCheckbox
                documentId={row.id}
                variant="mobile"
                ariaLabel={tCommon("selectRow", { name: row.code })}
              />
              <Link
                href={`/settings/subtasks/flags/${row.id}`}
                className="block min-w-0 flex-1 rounded-xl border p-3"
              >
                <p className="font-mono font-medium">{row.code}</p>
                <p className="text-sm text-muted-foreground">
                  {row.categoryName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <ListLoadMore
          visible={hasMore}
          loading={loading || isPending}
          onClick={handleLoadMore}
        />
        <ConfirmDialog
          open={deleteOpen}
          title={t("flagsBulkDeleteTitle")}
          description={t("flagsBulkDeleteConfirm")}
          disabled={isPending}
          onConfirm={handleBulkDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
        />
      </div>
    </ListSelectionProvider>
  );
}
