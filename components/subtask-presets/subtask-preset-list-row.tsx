"use client";

import { useTranslations } from "next-intl";

import type { SubTaskPreset } from "@/lib/business/subtask-preset";

import {
  SubtaskPresetListRowPresentational,
  type SubtaskPresetListRowLabels,
} from "./subtask-preset-list-row-presentational";

export interface SubtaskPresetListRowProps {
  preset: SubTaskPreset;
  variant: "table" | "mobile";
}

export function SubtaskPresetListRowView({
  preset,
  variant,
}: SubtaskPresetListRowProps) {
  const tSharing = useTranslations("subtasks.sharingType");
  const labels: SubtaskPresetListRowLabels = {
    sharingType: tSharing(preset.sharingType),
    actionName: preset.actionName,
  };

  return (
    <SubtaskPresetListRowPresentational
      preset={preset}
      variant={variant}
      labels={labels}
    />
  );
}
