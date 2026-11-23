"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ListFilterModalShell } from "@/components/ui/list-filter-modal-shell";
import { SwitchField } from "@/components/ui/switch-field";
import type { WorkdayAction, WorkdayScope } from "@/lib/schemas/workday";
import type { WorkdayListFilters } from "@/lib/schemas/workday-list-filters";
import {
  defaultWorkdayListFilters,
  serializeWorkdayListSearchParams,
} from "@/lib/workdays/workday-list-params";
import { WORKDAYS_LIST_PATH } from "@/lib/workdays/workday-list-sort-url";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground";

export interface WorkdaysFilterModalProps {
  initialFilters: WorkdayListFilters;
  onClose: () => void;
}

export function WorkdaysFilterModal({
  initialFilters,
  onClose,
}: WorkdaysFilterModalProps) {
  const t = useTranslations("workdays");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<WorkdayListFilters>(initialFilters);

  function applyFilters(next: WorkdayListFilters): void {
    const query = serializeWorkdayListSearchParams(next).toString();
    startTransition(() => {
      router.replace(query ? `${WORKDAYS_LIST_PATH}?${query}` : WORKDAYS_LIST_PATH);
      onClose();
    });
  }

  function handleClear(): void {
    const cleared = {
      ...defaultWorkdayListFilters(),
      q: initialFilters.q,
      column: initialFilters.column,
      direction: initialFilters.direction,
    };
    setDraft(cleared);
    applyFilters(cleared);
  }

  return (
    <ListFilterModalShell
      titleId="workdays-filter-modal-title"
      title={t("filters")}
      disabled={isPending}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleClear}
          >
            {t("clearFilters")}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => applyFilters(draft)}
          >
            {t("applyFilters")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="workdays-filter-action">{t("actionFilter")}</Label>
          <select
            id="workdays-filter-action"
            value={draft.action ?? ""}
            disabled={isPending}
            className={SELECT_CLASS}
            onChange={(event) => {
              const value = event.target.value as WorkdayAction | "";
              setDraft((current) => ({
                ...current,
                action: value || undefined,
              }));
            }}
          >
            <option value="">{t("allOptions")}</option>
            <option value="work">{t("actionWork")}</option>
            <option value="off">{t("actionOff")}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="workdays-filter-scope">{t("scopeFilter")}</Label>
          <select
            id="workdays-filter-scope"
            value={draft.scope ?? ""}
            disabled={isPending}
            className={SELECT_CLASS}
            onChange={(event) => {
              const value = event.target.value as WorkdayScope | "";
              setDraft((current) => ({
                ...current,
                scope: value || undefined,
              }));
            }}
          >
            <option value="">{t("allOptions")}</option>
            <option value="global">{t("scopeGlobal")}</option>
            <option value="team">{t("scopeTeam")}</option>
            <option value="user">{t("scopeUser")}</option>
          </select>
        </div>

        <SwitchField
          id="workdays-filter-archived"
          label={t("showArchived")}
          checked={draft.showArchived}
          disabled={isPending}
          onCheckedChange={(checked) =>
            setDraft((current) => ({ ...current, showArchived: checked }))
          }
        />
      </div>
    </ListFilterModalShell>
  );
}
