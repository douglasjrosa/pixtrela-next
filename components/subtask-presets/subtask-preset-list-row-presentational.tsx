"use client";

import type { KeyboardEvent } from "react";

import type { SubTaskPreset } from "@/lib/business/subtask-preset";

import { useSubTaskPresetList } from "./subtask-preset-list-context";

const CENTER_CELL_CLASS = "text-center";

export type SubtaskPresetListRowLabels = {
  sharingType: string;
  expectedTime: string;
};

export interface SubtaskPresetListRowPresentationalProps {
  preset: SubTaskPreset;
  variant: "table" | "mobile";
  labels: SubtaskPresetListRowLabels;
}

export function SubtaskPresetListRowPresentational({
  preset,
  variant,
  labels,
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

  if (variant === "table") {
    return (
      <tr className="cursor-pointer border-b hover:bg-muted/40" {...rowProps}>
        <td className="py-2">{preset.name}</td>
        <td className={CENTER_CELL_CLASS}>{labels.sharingType}</td>
        <td className={CENTER_CELL_CLASS}>{labels.expectedTime}</td>
      </tr>
    );
  }

  return (
    <li
      className="list-none cursor-pointer border-b py-3 hover:bg-muted/40"
      {...rowProps}
    >
      <div className="text-base font-medium">{preset.name}</div>
      <div className="text-muted-foreground text-sm">{labels.sharingType}</div>
      <div className="text-muted-foreground text-sm">{labels.expectedTime}</div>
    </li>
  );
}
