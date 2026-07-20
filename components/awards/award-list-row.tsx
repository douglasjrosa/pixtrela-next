import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

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

export function AwardListRow({
  award,
  currencies,
  variant,
  onOpen,
}: AwardListRowProps) {
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
    "aria-label": award.name,
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
        <td className="py-2">{award.name}</td>
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
      <div className="text-base font-medium">{award.name}</div>
      <div className="text-muted-foreground text-sm">{costLabel}</div>
    </li>
  );
}
