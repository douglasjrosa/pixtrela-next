import { getTranslations } from "next-intl/server";

import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { formatDurationMinutes } from "@/lib/format/duration";

import {
  SubtaskPresetListRowPresentational,
  type SubtaskPresetListRowLabels,
} from "./subtask-preset-list-row-presentational";

export interface SubtaskPresetListRowProps {
  preset: SubTaskPreset;
  variant: "table" | "mobile";
}

export async function SubtaskPresetListRowView({
  preset,
  variant,
}: SubtaskPresetListRowProps) {
  const tSharing = await getTranslations("subtasks.sharingType");
  const tDuration = await getTranslations("duration");
  const labels: SubtaskPresetListRowLabels = {
    sharingType: tSharing(preset.sharingType),
    expectedTime: formatDurationMinutes(preset.expectedTime, (key, values) =>
      tDuration(key, values),
    ),
  };

  return (
    <SubtaskPresetListRowPresentational
      preset={preset}
      variant={variant}
      labels={labels}
    />
  );
}
