"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DatePtBrInput } from "@/components/ui/date-ptbr-input";
import { Label } from "@/components/ui/label";
import { isTaskListDateRangeWithinMaxMonths } from "@/lib/business/task-list-date-range";
import { ACTIVITY_ACTIONS } from "@/lib/schemas/activity";
import type { ActivityListFilters } from "@/lib/schemas/activity-list-filters";
import {
  defaultActivityListFilters,
  serializeActivityListSearchParams,
} from "@/lib/activities/activity-list-params";
import { showErrorToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

export interface ActivitiesFilterModalProps {
  open: boolean;
  initialFilters: ActivityListFilters;
  onClose: () => void;
}

export function ActivitiesFilterModal({
  open,
  initialFilters,
  onClose,
}: ActivitiesFilterModalProps) {
  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<ActivityListFilters>(initialFilters);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialFilters, setPrevInitialFilters] = useState(initialFilters);
  if (open && (open !== prevOpen || initialFilters !== prevInitialFilters)) {
    setPrevOpen(open);
    setPrevInitialFilters(initialFilters);
    setDraft(initialFilters);
  } else if (open !== prevOpen) {
    setPrevOpen(open);
  }

  if (!open) return null;

  const titleId = "activities-filter-modal-title";

  function toggleAction(action: (typeof ACTIVITY_ACTIONS)[number]): void {
    setDraft((current) => {
      const has = current.actions.includes(action);
      if (has && current.actions.length === 1) return current;
      const actions = has
        ? current.actions.filter((value) => value !== action)
        : [...current.actions, action].sort();
      return { ...current, actions };
    });
  }

  function applyFilters(next: ActivityListFilters): void {
    const params = serializeActivityListSearchParams(next);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/activities?${query}` : "/activities");
      onClose();
    });
  }

  function handleApply(): void {
    if (!isTaskListDateRangeWithinMaxMonths(draft.from, draft.to)) {
      showErrorToast(t("dateRangeTooLong"));
      return;
    }
    applyFilters(draft);
  }

  function handleClear(): void {
    const cleared = defaultActivityListFilters();
    setDraft(cleared);
    applyFilters(cleared);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
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
          {t("filters")}
        </h2>

        <fieldset className="mb-4 space-y-2">
          <legend className="mb-2 text-sm font-medium">{t("actionFilter")}</legend>
          {ACTIVITY_ACTIONS.map((action) => (
            <label key={action} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className={cn("size-4 rounded border accent-primary")}
                checked={draft.actions.includes(action)}
                onChange={() => toggleAction(action)}
              />
              {t(`action.${action}`)}
            </label>
          ))}
        </fieldset>

        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className={cn("size-4 rounded border accent-primary")}
            checked={draft.showArchived}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                showArchived: event.target.checked,
              }))
            }
          />
          {t("showArchived")}
        </label>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="activity-filter-from">{t("dateFrom")}</Label>
            <DatePtBrInput
              id="activity-filter-from"
              value={draft.from}
              disabled={isPending}
              onChange={(from) =>
                setDraft((current) => ({
                  ...current,
                  from,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="activity-filter-to">{t("dateTo")}</Label>
            <DatePtBrInput
              id="activity-filter-to"
              value={draft.to}
              disabled={isPending}
              onChange={(to) =>
                setDraft((current) => ({
                  ...current,
                  to,
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
            {t("clearFilters")}
          </Button>
          <Button type="button" disabled={isPending} onClick={handleApply}>
            {t("applyFilters")}
          </Button>
        </div>
      </div>
    </div>
  );
}
