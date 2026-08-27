"use client";

import type { KeyboardEvent } from "react";

import type { FactoryAction } from "@/lib/business/factory-action";

import { useFactoryActionList } from "./factory-action-list-context";

const CENTER_CELL_CLASS = "text-center";

export type FactoryActionListRowLabels = {
  unitTime: string;
  qtyQuestion: string;
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
      <div className="text-base font-medium">{action.name}</div>
      <div className="text-muted-foreground text-sm">{labels.unitTime}</div>
      <div className="text-muted-foreground text-sm">{labels.qtyQuestion}</div>
    </li>
  );
}
