import type { SubTaskPreset } from "@/lib/business/subtask-preset";

import { SubtaskPresetListRowView } from "./subtask-preset-list-row";

export interface SubtaskPresetListTableBodyProps {
  presets: SubTaskPreset[];
}

export async function SubtaskPresetListTableBody({
  presets,
}: SubtaskPresetListTableBodyProps) {
  return (
    <tbody>
      {presets.map((preset) => (
        <SubtaskPresetListRowView
          key={preset.documentId}
          preset={preset}
          variant="table"
        />
      ))}
    </tbody>
  );
}
