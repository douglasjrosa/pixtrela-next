"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TASK_STATUSES } from "@/lib/schemas/task";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import {
  defaultTaskListFilters,
  serializeTaskListSearchParams,
} from "@/lib/tasks/task-list-params";
import { cn } from "@/lib/utils";

export interface TasksFilterModalProps {
  open: boolean;
  initialFilters: TaskListFilters;
  onClose: () => void;
}

export function TasksFilterModal({
  open,
  initialFilters,
  onClose,
}: TasksFilterModalProps) {
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<TaskListFilters>(initialFilters);

  useEffect(() => {
    if (open) {
      setDraft(initialFilters);
    }
  }, [open, initialFilters]);

  if (!open) return null;

  const titleId = "tasks-filter-modal-title";

  function toggleStatus(status: (typeof TASK_STATUSES)[number]): void {
    setDraft((current) => {
      const has = current.statuses.includes(status);
      if (has && current.statuses.length === 1) return current;
      const statuses = has
        ? current.statuses.filter((value) => value !== status)
        : [...current.statuses, status].sort();
      return { ...current, statuses };
    });
  }

  function applyFilters(next: TaskListFilters): void {
    const params = serializeTaskListSearchParams(next);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/tasks?${query}` : "/tasks");
      onClose();
    });
  }

  function handleApply(): void {
    applyFilters(draft);
  }

  function handleClear(): void {
    const cleared = defaultTaskListFilters();
    setDraft(cleared);
    applyFilters(cleared);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          "relative w-full max-w-md rounded-lg border bg-background p-4 " +
          "shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          disabled={isPending}
          aria-label={tCommon("close")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>

        <h2 id={titleId} className="mb-4 pr-10 text-lg font-semibold">
          {tManage("filters")}
        </h2>

        <fieldset className="mb-4 space-y-2">
          <legend className="mb-2 text-sm font-medium">
            {tManage("statusFilter")}
          </legend>
          {TASK_STATUSES.map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                className={cn("size-4 rounded border accent-primary")}
                checked={draft.statuses.includes(status)}
                onChange={() => toggleStatus(status)}
              />
              {tStatus(status)}
            </label>
          ))}
        </fieldset>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="task-filter-from">{tManage("dateFrom")}</Label>
            <Input
              id="task-filter-from"
              type="date"
              value={draft.from}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  from: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="task-filter-to">{tManage("dateTo")}</Label>
            <Input
              id="task-filter-to"
              type="date"
              value={draft.to ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  to: event.target.value || undefined,
                }))
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleClear}
          >
            {tManage("clearFilters")}
          </Button>
          <Button type="button" disabled={isPending} onClick={handleApply}>
            {tManage("applyFilters")}
          </Button>
        </div>
      </div>
    </div>
  );
}
