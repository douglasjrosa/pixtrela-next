import type { SubTaskPreset } from "@/lib/business/subtask-preset";

import { SubtaskPresetListRowView } from "./subtask-preset-list-row";

export interface SubtaskPresetListMobileListProps {
  presets: SubTaskPreset[];
}

export async function SubtaskPresetListMobileList({
  presets,
}: SubtaskPresetListMobileListProps) {
  return (
    <ul className="md:hidden">
      {presets.map((preset) => (
        <SubtaskPresetListRowView
          key={preset.documentId}
          preset={preset}
          variant="mobile"
        />
      ))}
    </ul>
  );
}
