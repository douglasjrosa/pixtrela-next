"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
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

export function TasksToolbar() {
  const tManage = useTranslations("tasks.manage");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = parseTaskListSearchParams(
    listSearchParamsRecord(searchParams),
  );

  return (
    <>
      <ListFiltersBar>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFiltersOpen(true)}
        >
          {tManage("filters")}
        </Button>
        <ListNameSearch
          pathname="/tasks"
          parseFilters={parseTaskListSearchParams}
          serializeFilters={serializeTaskListSearchParams}
          minChars={TASK_LIST_NAME_MIN_CHARS}
          label={tManage("searchByName")}
        />
      </ListFiltersBar>
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
