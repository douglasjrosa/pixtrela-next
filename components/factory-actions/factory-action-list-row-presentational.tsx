"use client";

import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import type { FactoryAction } from "@/lib/business/factory-action";
import { formatCompactDecimalPtBr } from "@/lib/format/decimal";

import { useFactoryActionList } from "./factory-action-list-context";

const CENTER_CELL_CLASS = "text-center";

export type FactoryActionListRowLabels = {
  unitTime: string;
  qtyQuestion: string;
  description: string;
  inactive: string;
  selectRow: string;
};

export interface FactoryActionListRowPresentationalProps {
  action: FactoryAction;
  variant: "table" | "mobile";
  labels: FactoryActionListRowLabels;
  showCheckboxColumn?: boolean;
}

export function FactoryActionListRowPresentational({
  action,
  variant,
  labels,
  showCheckboxColumn = false,
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

  const nameCell = (
    <>
      {action.name}
      {!action.active ? (
        <CardBadge className="ml-2">{labels.inactive}</CardBadge>
      ) : null}
    </>
  );

  if (variant === "table") {
    return (
      <tr className="cursor-pointer border-b hover:bg-muted/40" {...rowProps}>
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={action.documentId}
            variant="table"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <td className="py-2">{nameCell}</td>
        <td className={CENTER_CELL_CLASS}>{labels.unitTime}</td>
        <td className={CENTER_CELL_CLASS}>{labels.qtyQuestion}</td>
      </tr>
    );
  }

  return (
    <li className="list-none border-b hover:bg-muted/40">
      <div className="flex items-start gap-3">
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={action.documentId}
            variant="mobile"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <div className="min-w-0 flex-1 cursor-pointer py-3" {...rowProps}>
          <div className="flex items-start justify-between gap-3">
            <div className="text-base font-medium">{nameCell}</div>
            <div className="shrink-0 text-muted-foreground text-sm">
              {tActions("unitTimeSeconds", {
                value: formatCompactDecimalPtBr(action.unitTime),
              })}
            </div>
          </div>
          <div className="pt-1.5 text-muted-foreground text-sm">
            {labels.description}
          </div>
        </div>
      </div>
    </li>
  );
}
