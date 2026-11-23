"use client";

import type { KeyboardEvent } from "react";

import { CardBadge } from "@/components/ui/card";
import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { cn } from "@/lib/utils";
import type { WorkdayRowLabels } from "@/lib/workdays/format-workday-row-labels";

import { useWorkdayList } from "./workday-list-context";
import type { WorkdayRow } from "./types";

const CELL_CLASS = "align-middle px-2 py-2";
const CENTER_CELL_CLASS = cn(CELL_CLASS, "text-center");
const MAX_VISIBLE_TARGETS = 3;

export interface WorkdayListRowPresentationalProps {
  workday: WorkdayRow;
  variant: "table" | "mobile";
  labels: WorkdayRowLabels;
  showCheckboxColumn?: boolean;
}

function targetChips(workday: WorkdayRow): { visible: string[]; extra: number } {
  const list =
    workday.scope === "team"
      ? workday.teams
      : workday.scope === "user"
        ? workday.users
        : [];
  if (list.length <= MAX_VISIBLE_TARGETS) {
    return { visible: list.map((item) => item.name), extra: 0 };
  }
  return {
    visible: list.slice(0, MAX_VISIBLE_TARGETS).map((item) => item.name),
    extra: list.length - MAX_VISIBLE_TARGETS,
  };
}

export function WorkdayListRowPresentational({
  workday,
  variant,
  labels,
  showCheckboxColumn = false,
}: WorkdayListRowPresentationalProps) {
  const { openEdit } = useWorkdayList();
  const archived = !workday.active;
  const activate = () => openEdit(workday);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };

  const nameCell = (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium">{workday.name}</span>
        {archived ? <CardBadge>{labels.inactiveLabel}</CardBadge> : null}
      </div>
      {workday.description ? (
        <span className="line-clamp-1 text-xs text-muted-foreground">
          {workday.description}
        </span>
      ) : null}
    </div>
  );

  const actionBadge = (
    <CardBadge
      className={cn(
        workday.action === "work"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
    >
      {labels.actionLabel}
    </CardBadge>
  );

  const targets = targetChips(workday);
  const scopeCell = (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <CardBadge>{labels.scopeLabel}</CardBadge>
      {targets.visible.map((name) => (
        <CardBadge key={name} className="bg-muted text-muted-foreground">
          {name}
        </CardBadge>
      ))}
      {targets.extra > 0 ? (
        <CardBadge className="bg-muted text-muted-foreground">
          +{targets.extra}
        </CardBadge>
      ) : null}
    </div>
  );

  const slotsCell = (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {labels.slotsSummary.map((summary) => (
        <CardBadge key={summary}>{summary}</CardBadge>
      ))}
    </div>
  );

  const rowClassName = cn(
    "cursor-pointer border-b hover:bg-muted/40",
    archived && "text-muted-foreground",
  );
  const rowProps = {
    onClick: activate,
    onKeyDown,
    role: "button" as const,
    tabIndex: 0,
    "aria-label": workday.name,
  };

  if (variant === "table") {
    return (
      <tr className={rowClassName} {...rowProps}>
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={workday.documentId}
            variant="table"
            ariaLabel={labels.selectRowLabel}
          />
        ) : null}
        <td className={CELL_CLASS}>{nameCell}</td>
        <td className={CENTER_CELL_CLASS}>{actionBadge}</td>
        <td className={CENTER_CELL_CLASS}>{scopeCell}</td>
        <td className={CENTER_CELL_CLASS}>{labels.validityLabel}</td>
        <td className={CENTER_CELL_CLASS}>{slotsCell}</td>
      </tr>
    );
  }

  return (
    <li className={cn("list-none py-3", rowClassName)} {...rowProps}>
      <div className="flex items-start gap-3">
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={workday.documentId}
            variant="mobile"
            ariaLabel={labels.selectRowLabel}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="text-base">{nameCell}</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {actionBadge}
            <CardBadge>{labels.scopeLabel}</CardBadge>
            {targets.visible.map((name) => (
              <CardBadge key={name} className="bg-muted text-muted-foreground">
                {name}
              </CardBadge>
            ))}
            {targets.extra > 0 ? (
              <CardBadge className="bg-muted text-muted-foreground">
                +{targets.extra}
              </CardBadge>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">
            {labels.validityLabel} · {labels.slotsCountLabel}
          </div>
          {labels.slotsSummary.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {labels.slotsSummary.map((summary) => (
                <CardBadge key={summary}>{summary}</CardBadge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
