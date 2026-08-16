"use client";

import { useListRowActivateInteraction } from "@/lib/ui/list-row-interaction";
import { cn } from "@/lib/utils";
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
  const { interactive, activate, ...a11yProps } = useListRowActivateInteraction(
    preset.name,
    () => openEdit(preset),
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
        <td className="py-2">
          <span>{preset.name}</span>
        </td>
        <td className={CENTER_CELL_CLASS}>{labels.sharingType}</td>
        <td className={CENTER_CELL_CLASS}>{labels.expectedTime}</td>
      </tr>
    );
  }

  return (
    <li
      className={cn(
        "list-none border-b py-3",
        interactive && "cursor-pointer hover:bg-muted/40",
      )}
      onClick={activate}
      {...a11yProps}
    >
      <div className="text-base font-medium">{preset.name}</div>
      <div className="text-muted-foreground text-sm">{labels.sharingType}</div>
      <div className="text-muted-foreground text-sm">{labels.expectedTime}</div>
    </li>
  );
}
