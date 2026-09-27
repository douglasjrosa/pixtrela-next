import type { ReactNode } from "react";

import { ListFiltersBar } from "@/components/ui/list-filters-bar";

import { ListPageActionsSlot } from "./list-page-actions-slot";

/** Standard width for list page name search inputs in the toolbar row. */
export const LIST_PAGE_SEARCH_INPUT_CLASS = "w-80 max-w-full flex-none";

export interface ListPageToolbarProps {
  search?: ReactNode;
  filterButton?: ReactNode;
  trailingActions?: ReactNode;
}

export function ListPageToolbar({
  search,
  filterButton,
  trailingActions,
}: ListPageToolbarProps) {
  return (
    <ListFiltersBar className="flex-nowrap justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <ListPageActionsSlot />
        {search}
        {filterButton}
      </div>
      {trailingActions ? (
        <div className="flex shrink-0 items-center gap-2">
          {trailingActions}
        </div>
      ) : null}
    </ListFiltersBar>
  );
}
