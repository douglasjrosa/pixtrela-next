"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  bulkDeactivateUsers,
  bulkDeleteUsers,
  loadMoreUsers,
} from "@/app/(app)/users/actions";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import { ListLoadMore } from "@/components/ui/load-more-button";
import {
  areAllSelectedUsersDeactivated,
  areAllUsersSelected,
  selectedUsersFromList,
  toggleIdInSet,
  toggleSelectAllUsers,
} from "@/lib/business/user-list-selection";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { UserListFilters } from "@/lib/schemas/user-list-filters";
import { userListFilterKey } from "@/lib/users/user-list-params";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { UserListRowPresentational } from "./user-list-row-presentational";
import type { UserRow } from "./types";

export interface UsersListTableFrameProps {
  filters: UserListFilters;
  initialUsers: UserRow[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function UsersListTableFrame({
  filters,
  initialUsers,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
  tableBody,
  mobileList,
}: UsersListTableFrameProps) {
  const tUsers = useTranslations("users");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = userListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraUsers, setExtraUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const listResetKey = [
    filterKey,
    String(initialPage),
    String(initialHasMore),
    initialUsers.map((row) => row.documentId).join(","),
  ].join(":");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraUsers([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const users = [...initialUsers, ...extraUsers];
  const selectedUsers = selectedUsersFromList(users, selectedIds);
  const hasSelection = selectedUsers.length > 0;
  const allSelectedDeactivated = areAllSelectedUsersDeactivated(selectedUsers);
  const showDeactivateAction =
    hasSelection && !allSelectedDeactivated && canDeactivate;
  const showDeleteAction =
    hasSelection && allSelectedDeactivated && canDelete;

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreUsers(filters, nextPage);
        setExtraUsers((current) => [...current, ...result.users]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tUsers("saveFailed"));
      }
    });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) => toggleSelectAllUsers(users, current));
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleDeactivateConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeactivateUsers(selectedIds);
        showSuccessToast(tUsers("bulkDeactivated"));
        setDeactivateOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tUsers("saveFailed"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteUsers(selectedIds);
        showSuccessToast(tUsers("bulkDeleted"));
        setDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tUsers("saveFailed"));
      }
    });
  }

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllUsersSelected(users, selectedIds),
        onToggleSelect: handleToggleSelect,
        onToggleSelectAll: handleToggleSelectAll,
      }
    : null;

  function extraRow(user: UserRow, variant: "table" | "mobile") {
    return (
      <UserListRowPresentational
        key={user.documentId}
        user={user}
        variant={variant}
        labels={{
          role: tUsers(`roles.${user.roleType}`),
          selectRow: tCommon("selectRow", { name: user.name }),
          inactive: tUsers("inactive"),
        }}
        showCheckboxColumn={showCheckboxColumn}
      />
    );
  }

  return (
    <ListSelectionProvider value={selectionValue}>
      <div className="flex min-h-0 flex-1 flex-col">
        {bulkEnabled ? (
          <BulkListToolbar
            showArchive={showDeactivateAction}
            showDelete={showDeleteAction}
            archiveLabel={tUsers("deactivateSelected")}
            deleteLabel={tUsers("deleteSelected")}
            disabled={isPending}
            onArchive={() => setDeactivateOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="hidden w-full text-sm md:table">
            {tableHeader}
            {tableBody}
            {extraUsers.length > 0 ? (
              <tbody>{extraUsers.map((user) => extraRow(user, "table"))}</tbody>
            ) : null}
          </table>

          {mobileList}

          {extraUsers.length > 0 ? (
            <ul className="md:hidden">
              {extraUsers.map((user) => extraRow(user, "mobile"))}
            </ul>
          ) : null}
        </div>

        <ListLoadMore
          visible={hasMore}
          loading={isPending}
          onClick={handleLoadMore}
        />

        <ConfirmDialog
          open={deactivateOpen}
          title={tUsers("bulkDeactivateTitle")}
          description={tUsers.rich("bulkDeactivateConfirm", {
            count: selectedUsers.length,
            b: (chunks) => <b>{chunks}</b>,
          })}
          confirmLabel={tCommon("yes")}
          cancelLabel={tCommon("cancel")}
          confirmVariant="default"
          disabled={isPending}
          onConfirm={handleDeactivateConfirm}
          onClose={() => setDeactivateOpen(false)}
        />

        <ConfirmDialog
          open={deleteOpen}
          title={tUsers("bulkDeleteTitle")}
          description={tUsers("bulkDeleteConfirm")}
          confirmLabel={tCommon("delete")}
          disabled={isPending}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteOpen(false)}
        />
      </div>
    </ListSelectionProvider>
  );
}
