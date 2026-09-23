"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { deleteLogs, loadMoreLogs } from "@/app/(app)/settings/logs/actions";
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
import { formatActivityDateTimePtBr } from "@/lib/format/datetime";
import {
  buildLogListSortHref,
  logListFilterKey,
} from "@/lib/logs/log-list-params";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { LogListItem } from "@/lib/repos/logs";
import type { LogListFilters } from "@/lib/schemas/log-list-filters";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import {
  LIST_SORT_HEADER_LINK_CLASS,
  listSortHeaderFontClass,
} from "@/lib/ui/table-head-styles";
import { cn } from "@/lib/utils";

function toSelectable(row: LogListItem) {
  return { documentId: row.id };
}

export function LogsListFrame({
  filters,
  initialItems,
  initialHasMore,
}: {
  filters: LogListFilters;
  initialItems: LogListItem[];
  initialHasMore: boolean;
}) {
  const t = useTranslations("settings.logs");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = logListFilterKey(filters);
  const [extra, setExtra] = useState<LogListItem[]>([]);
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
  const sortHref = buildLogListSortHref(filters);
  const sortAscending = filters.direction === "asc";

  async function handleLoadMore(): Promise<void> {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const body = await loadMoreLogs(filters, nextPage);
      setExtra((current) => [...current, ...body.items]);
      setPage(nextPage);
      setHasMore(body.hasMore);
    } catch (error) {
      rethrowIfNavigationError(error);
      showErrorToast(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(): void {
    startTransition(async () => {
      try {
        await deleteLogs(selectedIds);
        setRemovedIds((current) => [...current, ...selectedIds]);
        setSelectedIds([]);
        setDeleteOpen(false);
        showSuccessToast(t("deleted"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("deleteFailed"));
      }
    });
  }

  const selectionValue = {
    selectedIds,
    allSelected: areAllRowsSelected(selectable, selectedIds),
    onToggleSelect: (id: string) => {
      setSelectedIds((current) => toggleIdInSet(current, id));
    },
    onToggleSelectAll: () => {
      setSelectedIds((current) => toggleSelectAllRows(selectable, current));
    },
  };

  return (
    <ListSelectionProvider value={selectionValue}>
      <div className="space-y-3">
        {hasSelection ? (
          <div className="flex justify-end">
            <BulkListToolbar
              showArchive={false}
              showDelete
              archiveLabel=""
              deleteLabel={tCommon("delete")}
              disabled={isPending}
              onArchive={() => undefined}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="w-10 py-2">
                  <ListRowCheckbox
                    documentId=""
                    variant="table-header"
                    selectAll
                    ariaLabel={tCommon("selectAll")}
                  />
                </th>
                <th className="py-2 text-left">
                  <Link
                    href={sortHref}
                    scroll={false}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1",
                      listSortHeaderFontClass(true),
                      LIST_SORT_HEADER_LINK_CLASS,
                    )}
                    aria-sort={sortAscending ? "ascending" : "descending"}
                  >
                    <span>{t("columns.when")}</span>
                    {sortAscending ? (
                      <ArrowUp className="size-3.5 shrink-0" aria-hidden />
                    ) : (
                      <ArrowDown className="size-3.5 shrink-0" aria-hidden />
                    )}
                  </Link>
                </th>
                <th className="px-2 py-2 text-left font-medium text-primary">
                  {t("columns.user")}
                </th>
                <th className="px-2 py-2 text-left font-medium text-primary">
                  {t("columns.route")}
                </th>
                <th className="px-2 py-2 text-left font-medium text-primary">
                  {t("columns.description")}
                </th>
                <th className="px-2 py-2 text-right font-medium text-primary">
                  {t("columns.count")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <ListRowCheckbox
                    documentId={row.id}
                    variant="table"
                    ariaLabel={tCommon("selectRow", {
                      name: row.description,
                    })}
                  />
                  <td className="px-2 py-3 whitespace-nowrap">
                    {formatActivityDateTimePtBr(row.createdAt)}
                  </td>
                  <td className="px-2 py-3">
                    {row.userLabel ?? t("system")}
                  </td>
                  <td className="px-2 py-3 font-mono">{row.route}</td>
                  <td className="px-2 py-3">
                    <div>{row.description}</div>
                    {row.detail ? (
                      <div className="text-muted-foreground mt-1 font-mono text-xs">
                        {row.detail}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-3 text-right">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListLoadMore
          visible={hasMore}
          loading={loading}
          onClick={() => {
            void handleLoadMore();
          }}
        />
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={tCommon("delete")}
        disabled={isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </ListSelectionProvider>
  );
}
