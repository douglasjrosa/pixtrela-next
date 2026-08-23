"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  bulkArchiveTeams,
  bulkDeleteTeams,
  loadMoreTeams,
} from "@/app/(app)/teams/actions";
import { ListLoadMore } from "@/components/ui/load-more-button";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import {
  areAllSelectedTeamsArchived,
  areAllTeamsSelected,
  selectedTeamsFromList,
  toggleIdInSet,
  toggleSelectAllTeams,
} from "@/lib/business/team-list-selection";
import { formatDatePtBr } from "@/lib/format/datetime";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TeamListFilters } from "@/lib/schemas/team-list-filters";
import { teamListFilterKey } from "@/lib/teams/team-list-params";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TeamListRowPresentational } from "./team-list-row-presentational";
import type { TeamRow } from "./types";

export interface TeamsListTableFrameProps {
  filters: TeamListFilters;
  initialTeams: TeamRow[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function TeamsListTableFrame({
  filters,
  initialTeams,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
  tableBody,
  mobileList,
}: TeamsListTableFrameProps) {
  const tTeams = useTranslations("teams");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = teamListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraTeams, setExtraTeams] = useState<TeamRow[]>([]);
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
    initialTeams.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraTeams([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const teams = [...initialTeams, ...extraTeams];
  const selectedTeams = selectedTeamsFromList(teams, selectedIds);
  const hasSelection = selectedTeams.length > 0;
  const allSelectedArchived = areAllSelectedTeamsArchived(selectedTeams);
  const showArchiveAction =
    hasSelection && !allSelectedArchived && canDeactivate;
  const showDeleteAction = hasSelection && allSelectedArchived && canDelete;

  const showUntillColumn = filters.showArchived;

  function labelsFor(team: TeamRow) {
    return {
      since: formatDatePtBr(team.since),
      untill: formatDatePtBr(team.untill),
      leader: team.leader?.name ?? tTeams("noLeader"),
      inactive: tTeams("inactive"),
      selectRow: tCommon("selectRow", { name: team.name }),
    };
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreTeams(filters, nextPage);
        setExtraTeams((current) => [...current, ...result.teams]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTeams("error"));
      }
    });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) => toggleSelectAllTeams(teams, current));
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleArchiveConfirm(): void {
    startTransition(async () => {
      try {
        await bulkArchiveTeams(selectedIds);
        showSuccessToast(tTeams("bulkArchived"));
        setArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTeams("error"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteTeams(selectedIds);
        showSuccessToast(tTeams("bulkDeleted"));
        setDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTeams("error"));
      }
    });
  }

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllTeamsSelected(teams, selectedIds),
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
            archiveLabel={tTeams("archiveSelected")}
            deleteLabel={tTeams("deleteSelected")}
            disabled={isPending}
            onArchive={() => setArchiveOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="hidden w-full text-sm md:table">
            {tableHeader}
            {tableBody}
            {extraTeams.length > 0 ? (
              <tbody>
                {extraTeams.map((team) => (
                  <TeamListRowPresentational
                    key={team.documentId}
                    team={team}
                    variant="table"
                    labels={labelsFor(team)}
                    showCheckboxColumn={showCheckboxColumn}
                    showUntillColumn={showUntillColumn}
                  />
                ))}
              </tbody>
            ) : null}
          </table>

          {mobileList}

          {extraTeams.length > 0 ? (
            <ul className="md:hidden">
              {extraTeams.map((team) => (
                <TeamListRowPresentational
                  key={team.documentId}
                  team={team}
                  variant="mobile"
                  labels={labelsFor(team)}
                  showCheckboxColumn={showCheckboxColumn}
                  showUntillColumn={showUntillColumn}
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
          title={tTeams("bulkArchiveTitle")}
          description={tTeams.rich("bulkArchiveConfirm", {
            count: selectedTeams.length,
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
          title={tTeams("bulkDeleteTitle")}
          description={tTeams("bulkDeleteConfirm")}
          confirmLabel={tCommon("delete")}
          disabled={isPending}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
        />
      </div>
    </ListSelectionProvider>
  );
}
