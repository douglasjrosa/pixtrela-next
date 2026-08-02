import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

import { AwardListImage } from "./award-list-image";
import {
  formatAwardValueRow,
  type AwardRow,
  type CurrencyOption,
} from "./types";

export interface AwardListRowProps {
  award: AwardRow;
  currencies: CurrencyOption[];
  variant: "table" | "mobile";
  onOpen: (award: AwardRow) => void;
}

function awardDisplayTitle(award: AwardRow): string {
  const title = award.title?.trim();
  return title || award.name;
}

export function AwardListRow({
  award,
  currencies,
  variant,
  onOpen,
}: AwardListRowProps) {
  const displayTitle = awardDisplayTitle(award);
  const costLabel =
    award.values.length > 0
      ? award.values
          .map((entry) => formatAwardValueRow(entry, currencies))
          .join(", ")
      : "—";

  function openAward(): void {
    onOpen(award);
  }

  const interaction = {
    tabIndex: 0 as const,
    role: "link" as const,
    "aria-label": displayTitle,
    onClick: openAward,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAward();
      }
    },
  };

  if (variant === "table") {
    return (
      <tr
        {...interaction}
        className={cn(
          "border-b cursor-pointer hover:bg-muted/40",
          "focus-visible:bg-muted/40 focus-visible:outline-none",
        )}
      >
        <td className="w-12 py-2 pr-3">
          <AwardListImage label={displayTitle} imageUrl={award.imageUrl} />
        </td>
        <td className="py-2">{displayTitle}</td>
        <td>{costLabel}</td>
      </tr>
    );
  }

  return (
    <li
      {...interaction}
      className={cn(
        "list-none border-b py-3 cursor-pointer hover:bg-muted/40",
        "focus-visible:bg-muted/40 focus-visible:outline-none",
      )}
    >
      <div className="flex items-center gap-3">
        <AwardListImage label={displayTitle} imageUrl={award.imageUrl} />
        <div className="min-w-0 flex-1">
          <div className="text-base font-medium">{displayTitle}</div>
          <div className="text-muted-foreground text-sm">{costLabel}</div>
        </div>
      </div>
    </li>
  );
}
