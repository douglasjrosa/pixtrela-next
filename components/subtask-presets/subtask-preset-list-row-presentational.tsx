"use client";

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

  const nameButton = (
    <button
      type="button"
      className="text-left hover:underline"
      onClick={() => openEdit(preset)}
    >
      {preset.name}
    </button>
  );

  if (variant === "table") {
    return (
      <tr className="border-b hover:bg-muted/40">
        <td className="py-2">{nameButton}</td>
        <td className={CENTER_CELL_CLASS}>{labels.sharingType}</td>
        <td className={CENTER_CELL_CLASS}>{labels.expectedTime}</td>
      </tr>
    );
  }

  return (
    <li className="list-none border-b py-3 hover:bg-muted/40">
      <div className="text-base font-medium">{nameButton}</div>
      <div className="text-muted-foreground text-sm">{labels.sharingType}</div>
      <div className="text-muted-foreground text-sm">{labels.expectedTime}</div>
    </li>
  );
}
