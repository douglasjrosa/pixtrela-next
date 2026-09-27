"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ListNameSearch } from "@/components/ui/list-name-search";
import { ListPageFilterButton } from "@/components/ui/list-page-filter-button";
import {
  LIST_PAGE_SEARCH_INPUT_CLASS,
  ListPageToolbar,
} from "@/components/ui/list-page-toolbar";
import { TASK_LIST_NAME_MIN_CHARS } from "@/lib/schemas/task-list-filters";
import {
  parseTaskListSearchParams,
  serializeTaskListSearchParams,
} from "@/lib/tasks/task-list-params";
import { listSearchParamsRecord } from "@/lib/ui/list-url";

const TasksFilterModal = dynamic(
  () =>
    import("./tasks-filter-modal").then((module) => module.TasksFilterModal),
  { ssr: false },
);

export function TasksToolbar({ actions }: { actions?: ReactNode }) {
  const tManage = useTranslations("tasks.manage");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = parseTaskListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListPageToolbar
        search={
          <ListNameSearch
            pathname="/tasks"
            parseFilters={parseTaskListSearchParams}
            serializeFilters={serializeTaskListSearchParams}
            minChars={TASK_LIST_NAME_MIN_CHARS}
            label={tManage("searchByName")}
            className={LIST_PAGE_SEARCH_INPUT_CLASS}
          />
        }
        filterButton={
          <ListPageFilterButton
            ariaLabel={tManage("filters")}
            onClick={() => setFiltersOpen(true)}
          />
        }
        trailingActions={actions}
      />
      {filtersOpen ? (
        <TasksFilterModal
          open={filtersOpen}
          initialFilters={filters}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
    </>
  );
}
