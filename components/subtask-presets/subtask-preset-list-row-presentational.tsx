"use client";

import type { KeyboardEvent } from "react";

import { CardBadge } from "@/components/ui/card";
import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";

import { useSubTaskPresetList } from "./subtask-preset-list-context";

const CENTER_CELL_CLASS = "text-center";

export type SubtaskPresetListRowLabels = {
  sharingType: string;
  actionName: string;
  inactive: string;
  selectRow: string;
};

export interface SubtaskPresetListRowPresentationalProps {
  preset: SubTaskPreset;
  variant: "table" | "mobile";
  labels: SubtaskPresetListRowLabels;
  showCheckboxColumn?: boolean;
}

export function SubtaskPresetListRowPresentational({
  preset,
  variant,
  labels,
  showCheckboxColumn = false,
}: SubtaskPresetListRowPresentationalProps) {
  const { openEdit } = useSubTaskPresetList();
  const activate = () => openEdit(preset);
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
    "aria-label": preset.name,
  };

  const nameCell = (
    <>
      {preset.name}
      {!preset.active ? (
        <CardBadge className="ml-2">{labels.inactive}</CardBadge>
      ) : null}
    </>
  );

  if (variant === "table") {
    return (
      <tr className="cursor-pointer border-b hover:bg-muted/40" {...rowProps}>
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={preset.documentId}
            variant="table"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <td className="py-2">{nameCell}</td>
        <td className={CENTER_CELL_CLASS}>{labels.sharingType}</td>
        <td className={CENTER_CELL_CLASS}>{labels.actionName}</td>
      </tr>
    );
  }

  return (
    <li className="list-none border-b hover:bg-muted/40">
      <div className="flex items-start gap-3">
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={preset.documentId}
            variant="mobile"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <div className="min-w-0 flex-1 cursor-pointer py-3" {...rowProps}>
          <div className="text-base font-medium">{nameCell}</div>
          <div className="text-muted-foreground text-sm">{labels.sharingType}</div>
          <div className="text-muted-foreground text-sm">{labels.actionName}</div>
        </div>
      </div>
    </li>
  );
}
