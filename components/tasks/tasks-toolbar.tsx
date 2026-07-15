"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { parseTaskListSearchParams } from "@/lib/tasks/task-list-params";

import { TasksFilterModal } from "./tasks-filter-modal";
import { TasksNameSearch } from "./tasks-name-search";

export function TasksToolbar() {
  const tManage = useTranslations("tasks.manage");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = parseTaskListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFiltersOpen(true)}
        >
          {tManage("filters")}
        </Button>
        <TasksNameSearch />
      </div>
      <TasksFilterModal
        open={filtersOpen}
        initialFilters={filters}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
