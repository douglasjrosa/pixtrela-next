"use client";

import { useTranslations } from "next-intl";

import { useSubTaskCategoryOptions } from "@/components/subtasks/subtask-category-options-context";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { resolveSubTaskCategoryDisplayName } from "@/lib/subtasks/resolve-category-display-name";

import {
  SubtaskPresetListRowPresentational,
  type SubtaskPresetListRowLabels,
} from "./subtask-preset-list-row-presentational";

export interface SubtaskPresetListRowProps {
  preset: SubTaskPreset;
  variant: "table" | "mobile";
  showCheckboxColumn?: boolean;
}

export function SubtaskPresetListRowView({
  preset,
  variant,
  showCheckboxColumn = false,
}: SubtaskPresetListRowProps) {
  const tSharing = useTranslations("subtasks.sharingType");
  const tSettings = useTranslations("settings");
  const tTemplates = useTranslations("templates");
  const tCommon = useTranslations("common");
  const categoryOptions = useSubTaskCategoryOptions();
  const labels: SubtaskPresetListRowLabels = {
    sharingType: tSharing(preset.sharingType),
    actionName: preset.actionName,
    categoryName: resolveSubTaskCategoryDisplayName(
      preset.subTaskCategoryId,
      categoryOptions,
      preset.subTaskCategoryName,
      tSettings("noCategory"),
    ),
    inactive: tTemplates("inactive"),
    selectRow: tCommon("selectRow", { name: preset.name }),
  };

  return (
    <SubtaskPresetListRowPresentational
      preset={preset}
      variant={variant}
      labels={labels}
      showCheckboxColumn={showCheckboxColumn}
    />
  );
}
