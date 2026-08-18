"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { loadMoreUsers } from "@/app/(app)/users/actions";
import { LoadMoreButton, LoadMoreButtonRow } from "@/components/ui/load-more-button";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { UserListFilters } from "@/lib/schemas/user-list-filters";
import { userListFilterKey } from "@/lib/users/user-list-params";
import { showErrorToast } from "@/lib/ui/app-toast";

import { UserListRowPresentational } from "./user-list-row-presentational";
import type { UserRow } from "./types";

export interface UsersListTableFrameProps {
  filters: UserListFilters;
  initialUsers: UserRow[];
  initialPage: number;
  initialHasMore: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

export function UsersListTableFrame({
  filters,
  initialUsers,
  initialPage,
  initialHasMore,
  tableHeader,
  tableBody,
  mobileList,
}: UsersListTableFrameProps) {
  const tUsers = useTranslations("users");
  const filterKey = userListFilterKey(filters);
  const [extraUsers, setExtraUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
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
  }

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

  function extraRow(user: UserRow, variant: "table" | "mobile") {
    return (
      <UserListRowPresentational
        key={user.documentId}
        user={user}
        variant={variant}
        labels={{ role: tUsers(`roles.${user.roleType}`) }}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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

      {hasMore ? (
        <LoadMoreButtonRow>
          <LoadMoreButton
            loading={isPending}
            label={tUsers("loadMore")}
            loadingLabel={tUsers("loadingMore")}
            onClick={handleLoadMore}
          />
        </LoadMoreButtonRow>
      ) : null}
    </div>
  );
}
