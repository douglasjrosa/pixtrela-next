"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ListNameSearch } from "@/components/ui/list-name-search";
import { ListPageFilterButton } from "@/components/ui/list-page-filter-button";
import {
  LIST_PAGE_SEARCH_INPUT_CLASS,
  ListPageToolbar,
} from "@/components/ui/list-page-toolbar";
import { ListShowArchivedFilterModal } from "@/components/ui/list-show-archived-filter-modal";
import { USER_LIST_SEARCH_MIN_CHARS } from "@/lib/schemas/user-list-filters";
import {
  parseUserListSearchParams,
  serializeUserListSearchParams,
} from "@/lib/users/user-list-params";
import { USERS_LIST_PATH } from "@/lib/users/user-list-sort-url";
import { listSearchParamsRecord } from "@/lib/ui/list-url";

export function UsersToolbar({ trailingActions }: { trailingActions?: ReactNode }) {
  const tUsers = useTranslations("users");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = parseUserListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname={USERS_LIST_PATH}
            parseFilters={parseUserListSearchParams}
            serializeFilters={serializeUserListSearchParams}
            minChars={USER_LIST_SEARCH_MIN_CHARS}
            label={tUsers("searchByName")}
            className={LIST_PAGE_SEARCH_INPUT_CLASS}
          />
        }
        filterButton={
          <ListPageFilterButton
            ariaLabel={tUsers("filters")}
            onClick={() => setFiltersOpen(true)}
          />
        }
        trailingActions={trailingActions}
      />
      {filtersOpen ? (
        <ListShowArchivedFilterModal
          titleId="users-filter-modal-title"
          title={tUsers("filters")}
          showArchivedLabel={tUsers("showArchived")}
          clearLabel={tUsers("clearFilters")}
          applyLabel={tUsers("applyFilters")}
          pathname={USERS_LIST_PATH}
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
          serializeFilters={serializeUserListSearchParams}
        />
      ) : null}
    </>
  );
}
