import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { TemplateSubTaskFormInput } from "@/lib/schemas/template-sub-task";

export const SUBTASK_PRESET_MIN_QUERY_LENGTH = 3;

export interface SubTaskPreset {
  documentId: string;
  name: string;
  sharingType: "qty" | "duration";
  maxSameTimeWorkers: number;
  expectedTime: number;
}

export type SubTaskPresetApplyTarget = Pick<
  SubTaskFormInput | TemplateSubTaskFormInput,
  "name" | "sharingType" | "maxSameTimeWorkers" | "expectedTime"
>;

export function shouldSearchSubTaskPresets(query: string): boolean {
  return query.trim().length >= SUBTASK_PRESET_MIN_QUERY_LENGTH;
}

export function applySubTaskPreset<T extends SubTaskPresetApplyTarget>(
  current: T,
  preset: SubTaskPreset,
): T {
  return {
    ...current,
    name: preset.name,
    sharingType: preset.sharingType,
    maxSameTimeWorkers: preset.maxSameTimeWorkers,
    expectedTime: preset.expectedTime,
  };
}
