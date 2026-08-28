"use client";

import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import type { FactoryAction } from "@/lib/business/factory-action";
import { formatCompactDecimalPtBr } from "@/lib/format/decimal";

import { useFactoryActionList } from "./factory-action-list-context";

const CENTER_CELL_CLASS = "text-center";

export type FactoryActionListRowLabels = {
  unitTime: string;
  qtyQuestion: string;
  description: string;
};

export interface FactoryActionListRowPresentationalProps {
  action: FactoryAction;
  variant: "table" | "mobile";
  labels: FactoryActionListRowLabels;
}

export function FactoryActionListRowPresentational({
  action,
  variant,
  labels,
}: FactoryActionListRowPresentationalProps) {
  const tActions = useTranslations("factoryActions");
  const { openEdit } = useFactoryActionList();
  const activate = () => openEdit(action);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };
  const rowProps = {
    onClick: activate,
    onKeyDown,
    role: "button" as const,
    tabIndex: 0,
    "aria-label": action.name,
  };

  if (variant === "table") {
    return (
      <tr className="cursor-pointer border-b hover:bg-muted/40" {...rowProps}>
        <td className="py-2">{action.name}</td>
        <td className={CENTER_CELL_CLASS}>{labels.unitTime}</td>
        <td className={CENTER_CELL_CLASS}>{labels.qtyQuestion}</td>
      </tr>
    );
  }

  return (
    <li
      className="list-none cursor-pointer border-b py-3 hover:bg-muted/40"
      {...rowProps}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-medium">{action.name}</div>
        <div className="shrink-0 text-muted-foreground text-sm">
          {tActions("unitTimeSeconds", {
            value: formatCompactDecimalPtBr(action.unitTime),
          })}
        </div>
      </div>
      <div className="text-muted-foreground text-sm">{labels.description}</div>
    </li>
  );
}
