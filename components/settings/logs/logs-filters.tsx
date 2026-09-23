"use client";

import { useState, useTransition } from "react";
import { Funnel, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { loadMoreLogs } from "@/app/(app)/settings/logs/actions";
import { Button } from "@/components/ui/button";
import { DatePtBrInput } from "@/components/ui/date-ptbr-input";
import { Label } from "@/components/ui/label";
import {
  buildLogListHref,
  defaultLogListFilters,
  parseLogListSearchParams,
} from "@/lib/logs/log-list-params";
import { TRACKED_LOG_ROUTES } from "@/lib/logs/tracked-routes";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { LogActorOption, LogListItem } from "@/lib/repos/logs";
import type { LogListFilters } from "@/lib/schemas/log-list-filters";
import { LOG_ACTOR_FILTER_SYSTEM } from "@/lib/schemas/log-list-filters";
import { showErrorToast } from "@/lib/ui/app-toast";

const FIELD_CLASS =
  "border-input bg-background h-10 w-full rounded-md border px-3 text-sm";

type LogsFilterDraft = {
  actor: string;
  route: string;
  from: string;
  to: string;
  q: string;
};

function draftFromFilters(filters: LogListFilters): LogsFilterDraft {
  return {
    actor: filters.actor ?? "",
    route: filters.route ?? "",
    from: filters.from ?? "",
    to: filters.to ?? "",
    q: filters.q ?? "",
  };
}

export function LogsFiltersButton({
  filters,
  actors,
  onApplied,
}: {
  filters: LogListFilters;
  actors: LogActorOption[];
  onApplied: (filters: LogListFilters, result: {
    items: LogListItem[];
    hasMore: boolean;
  }) => void;
}) {
  const t = useTranslations("settings.logs");
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 justify-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("openFilters")}
          onClick={() => setOpen(true)}
        >
          <Funnel aria-hidden />
        </Button>
      </div>
      {open ? (
        <LogsFilterModal
          filters={filters}
          actors={actors}
          onClose={() => setOpen(false)}
          onApplied={(next, result) => {
            onApplied(next, result);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function LogsFilterModal({
  filters,
  actors,
  onClose,
  onApplied,
}: {
  filters: LogListFilters;
  actors: LogActorOption[];
  onClose: () => void;
  onApplied: (filters: LogListFilters, result: {
    items: LogListItem[];
    hasMore: boolean;
  }) => void;
}) {
  const t = useTranslations("settings.logs");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<LogsFilterDraft>(() =>
    draftFromFilters(filters),
  );
  const titleId = "logs-filter-modal-title";

  function apply(next: LogListFilters): void {
    startTransition(async () => {
      try {
        const result = await loadMoreLogs(next, 1);
        window.history.replaceState(null, "", buildLogListHref(next));
        onApplied(next, result);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("loadFailed"));
      }
    });
  }

  function handleApply(): void {
    apply(
      parseLogListSearchParams({
        actor: draft.actor,
        route: draft.route,
        from: draft.from,
        to: draft.to,
        q: draft.q,
        dir: filters.direction,
      }),
    );
  }

  function handleClear(): void {
    const cleared = defaultLogListFilters();
    setDraft(draftFromFilters(cleared));
    apply(cleared);
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
        className="relative w-full max-w-md rounded-lg border bg-background p-4 shadow-lg"
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
          {t("filtersTitle")}
        </h2>
        <div className="mb-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="logs-filter-actor">{t("filters.actor")}</Label>
            <select
              id="logs-filter-actor"
              className={FIELD_CLASS}
              value={draft.actor}
              disabled={isPending}
              onChange={(event) =>
                setDraft((current) => ({ ...current, actor: event.target.value }))
              }
            >
              <option value="">{t("allActors")}</option>
              <option value={LOG_ACTOR_FILTER_SYSTEM}>{t("system")}</option>
              {actors
                .filter((actor) => actor.id !== LOG_ACTOR_FILTER_SYSTEM)
                .map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.label}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="logs-filter-route">{t("filters.route")}</Label>
            <select
              id="logs-filter-route"
              className={FIELD_CLASS}
              value={draft.route}
              disabled={isPending}
              onChange={(event) =>
                setDraft((current) => ({ ...current, route: event.target.value }))
              }
            >
              <option value="">{t("allRoutes")}</option>
              {TRACKED_LOG_ROUTES.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="logs-filter-from">{t("filters.from")}</Label>
              <DatePtBrInput
                id="logs-filter-from"
                value={draft.from}
                disabled={isPending}
                onChange={(from) =>
                  setDraft((current) => ({ ...current, from }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="logs-filter-to">{t("filters.to")}</Label>
              <DatePtBrInput
                id="logs-filter-to"
                value={draft.to}
                disabled={isPending}
                onChange={(to) => setDraft((current) => ({ ...current, to }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="logs-filter-q">{t("filters.text")}</Label>
            <input
              id="logs-filter-q"
              className={FIELD_CLASS}
              value={draft.q}
              disabled={isPending}
              onChange={(event) =>
                setDraft((current) => ({ ...current, q: event.target.value }))
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
