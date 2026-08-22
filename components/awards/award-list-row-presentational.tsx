"use client";

import type { KeyboardEvent } from "react";

import { CardBadge } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { AwardListImage } from "./award-list-image";
import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { useAwardList } from "./award-list-context";
import { awardDisplayTitle, type AwardRow } from "./types";

const CENTER_CELL_CLASS = "text-center";

export type AwardListRowLabels = {
  cost: string;
  stock: string;
  showInStore: string;
  inactive: string;
  selectRow: string;
};

export interface AwardListRowPresentationalProps {
  award: AwardRow;
  variant: "table" | "mobile";
  labels: AwardListRowLabels;
  showCheckboxColumn?: boolean;
}

export function AwardListRowPresentational({
  award,
  variant,
  labels,
  showCheckboxColumn = false,
}: AwardListRowPresentationalProps) {
  const { openEdit } = useAwardList();
  const displayTitle = awardDisplayTitle(award);
  const interactive = Boolean(openEdit);
  const archived = !award.active;
  const activate = () => openEdit?.(award);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };
  const rowProps = interactive
    ? {
        onClick: activate,
        onKeyDown,
        role: "button" as const,
        tabIndex: 0,
        "aria-label": displayTitle,
      }
    : {};

  const titleCell = (
    <>
      <span className="font-medium">{displayTitle}</span>
      {archived ? (
        <CardBadge className="ml-2">{labels.inactive}</CardBadge>
      ) : null}
    </>
  );

  if (variant === "table") {
    return (
      <tr
        className={cn(
          "border-b",
          interactive && "cursor-pointer hover:bg-muted/40",
          archived && "text-muted-foreground",
        )}
        {...rowProps}
      >
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={award.documentId}
            variant="table"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <td className="w-12 py-2 pr-3">
          <AwardListImage label={displayTitle} imageUrl={award.imageUrl} />
        </td>
        <td className="py-2">{titleCell}</td>
        <td
          className={cn(
            CENTER_CELL_CLASS,
            "tabular-nums text-muted-foreground",
          )}
        >
          {labels.cost}
        </td>
        <td
          className={cn(
            CENTER_CELL_CLASS,
            "tabular-nums text-muted-foreground",
          )}
        >
          {labels.stock}
        </td>
        <td className={cn(CENTER_CELL_CLASS, "text-muted-foreground")}>
          {labels.showInStore}
        </td>
      </tr>
    );
  }

  return (
    <li
      className={cn(
        "border-b py-3",
        interactive && "cursor-pointer hover:bg-muted/40",
        archived && "text-muted-foreground",
      )}
      {...rowProps}
    >
      <div className="flex items-center gap-3">
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={award.documentId}
            variant="mobile"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <AwardListImage label={displayTitle} imageUrl={award.imageUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{titleCell}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {labels.cost}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {labels.stock} · {labels.showInStore}
          </p>
        </div>
      </div>
    </li>
  );
}
