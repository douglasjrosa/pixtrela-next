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
  onOpen?: (award: AwardRow) => void;
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
  const interactive = Boolean(onOpen);

  function openAward(): void {
    onOpen?.(award);
  }

  const interaction = interactive
    ? {
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
      }
    : {};

  if (variant === "table") {
    return (
      <tr
        {...interaction}
        className={cn(
          "border-b",
          interactive && "cursor-pointer hover:bg-muted/40",
        )}
      >
        <td className="w-12 py-2 pr-3">
          <AwardListImage label={displayTitle} imageUrl={award.imageUrl} />
        </td>
        <td className="py-2 font-medium">{displayTitle}</td>
        <td className="tabular-nums text-muted-foreground">{costLabel}</td>
      </tr>
    );
  }

  return (
    <li
      {...interaction}
      className={cn(
        "flex items-center gap-3 border-b py-3",
        interactive && "cursor-pointer hover:bg-muted/40",
      )}
    >
      <AwardListImage label={displayTitle} imageUrl={award.imageUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{displayTitle}</p>
        <p className="text-sm text-muted-foreground tabular-nums">{costLabel}</p>
      </div>
    </li>
  );
}
