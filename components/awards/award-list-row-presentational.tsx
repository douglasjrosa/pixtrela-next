"use client";

import { cn } from "@/lib/utils";
import { useListRowActivateInteraction } from "@/lib/ui/list-row-interaction";

import { AwardListImage } from "./award-list-image";
import { useAwardList } from "./award-list-context";
import { awardDisplayTitle, type AwardRow } from "./types";

const CENTER_CELL_CLASS = "text-center";

export type AwardListRowLabels = {
  cost: string;
};

export interface AwardListRowPresentationalProps {
  award: AwardRow;
  variant: "table" | "mobile";
  labels: AwardListRowLabels;
}

export function AwardListRowPresentational({
  award,
  variant,
  labels,
}: AwardListRowPresentationalProps) {
  const { openEdit } = useAwardList();
  const displayTitle = awardDisplayTitle(award);
  const { interactive, activate, ...a11yProps } = useListRowActivateInteraction(
    displayTitle,
    () => openEdit?.(award),
    Boolean(openEdit),
  );

  if (variant === "table") {
    return (
      <tr
        className={cn(
          "border-b",
          interactive && "cursor-pointer hover:bg-muted/40",
        )}
        onClick={activate}
        {...a11yProps}
      >
        <td className="w-12 py-2 pr-3">
          <AwardListImage label={displayTitle} imageUrl={award.imageUrl} />
        </td>
        <td className="py-2">
          <span className="font-medium">{displayTitle}</span>
        </td>
        <td
          className={cn(
            CENTER_CELL_CLASS,
            "tabular-nums text-muted-foreground",
          )}
        >
          {labels.cost}
        </td>
      </tr>
    );
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 border-b py-3",
        interactive && "cursor-pointer hover:bg-muted/40",
      )}
      onClick={activate}
      {...a11yProps}
    >
      <AwardListImage label={displayTitle} imageUrl={award.imageUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{displayTitle}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {labels.cost}
        </p>
      </div>
    </li>
  );
}
