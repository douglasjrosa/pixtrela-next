"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  bulkArchiveAwards,
  bulkDeleteAwards,
  loadMoreAwards,
} from "@/app/(app)/awards/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  areAllAwardsSelected,
  areAllSelectedAwardsArchived,
  selectedAwardsFromList,
  toggleIdInSet,
  toggleSelectAllAwards,
} from "@/lib/business/award-list-selection";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { AwardListFilters } from "@/lib/schemas/award-list-filters";
import { awardListFilterKey } from "@/lib/awards/award-list-params";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { awardCostLabel } from "./award-cost-label";
import { AwardListRowPresentational } from "./award-list-row-presentational";
import { AwardListSelectionProvider } from "./award-list-selection-context";
import type { AwardRow, CurrencyOption } from "./types";
import { awardDisplayTitle } from "./types";

export interface AwardsListTableFrameProps {
  filters: AwardListFilters;
  currencies: CurrencyOption[];
  initialAwards: AwardRow[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function AwardsListTableFrame({
  filters,
  currencies,
  initialAwards,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
  tableBody,
  mobileList,
}: AwardsListTableFrameProps) {
  const tAwards = useTranslations("awards");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = awardListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraAwards, setExtraAwards] = useState<AwardRow[]>([]);
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
    initialAwards.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraAwards([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const awards = [...initialAwards, ...extraAwards];
  const selectedAwards = selectedAwardsFromList(awards, selectedIds);
  const hasSelection = selectedAwards.length > 0;
  const allSelectedArchived = areAllSelectedAwardsArchived(selectedAwards);
  const showArchiveAction =
    hasSelection && !allSelectedArchived && canDeactivate;
  const showDeleteAction = hasSelection && allSelectedArchived && canDelete;

  function labelsFor(award: AwardRow) {
    return {
      cost: awardCostLabel(award, currencies, tAwards("noCost")),
      inactive: tAwards("inactive"),
      selectRow: tCommon("selectRow", { name: awardDisplayTitle(award) }),
    };
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreAwards(filters, nextPage);
        setExtraAwards((current) => [...current, ...result.awards]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tAwards("error"));
      }
    });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) => toggleSelectAllAwards(awards, current));
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleArchiveConfirm(): void {
    startTransition(async () => {
      try {
        await bulkArchiveAwards(selectedIds);
        showSuccessToast(tAwards("bulkArchived"));
        setArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tAwards("error"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteAwards(selectedIds);
        showSuccessToast(tAwards("bulkDeleted"));
        setDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tAwards("error"));
      }
    });
  }

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllAwardsSelected(awards, selectedIds),
        onToggleSelect: handleToggleSelect,
        onToggleSelectAll: handleToggleSelectAll,
      }
    : null;

  function extraRow(award: AwardRow, variant: "table" | "mobile") {
    return (
      <AwardListRowPresentational
        key={award.documentId}
        award={award}
        variant={variant}
        labels={labelsFor(award)}
        showCheckboxColumn={showCheckboxColumn}
      />
    );
  }

  return (
    <AwardListSelectionProvider value={selectionValue}>
      <div className="flex min-h-0 flex-1 flex-col">
        {bulkEnabled ? (
          <div className="flex h-10 shrink-0 items-center justify-end gap-2">
            {showArchiveAction ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={tAwards("archiveSelected")}
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
                aria-label={tAwards("deleteSelected")}
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
            {extraAwards.length > 0 ? (
              <tbody>{extraAwards.map((award) => extraRow(award, "table"))}</tbody>
            ) : null}
          </table>

          {mobileList}

          {extraAwards.length > 0 ? (
            <ul className="md:hidden">
              {extraAwards.map((award) => extraRow(award, "mobile"))}
            </ul>
          ) : null}
        </div>

        {hasMore ? (
          <div className="flex shrink-0 justify-center pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleLoadMore}
            >
              {isPending ? tAwards("loadingMore") : tAwards("loadMore")}
            </Button>
          </div>
        ) : null}

        <ConfirmDialog
          open={archiveOpen}
          title={tAwards("bulkArchiveTitle")}
          description={tAwards.rich("bulkArchiveConfirm", {
            count: selectedAwards.length,
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
          title={tAwards("bulkDeleteTitle")}
          description={tAwards("bulkDeleteConfirm")}
          confirmLabel={tCommon("delete")}
          disabled={isPending}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
        />
      </div>
    </AwardListSelectionProvider>
  );
}
