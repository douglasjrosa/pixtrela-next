import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { TemplateSubTaskFormInput } from "@/lib/schemas/template-sub-task";

export const SUBTASK_PRESET_MIN_QUERY_LENGTH = 3;

export interface SubTaskPreset {
  documentId: string;
  name: string;
  sharingType: "qty" | "duration";
  maxSameTimeWorkers: number;
  actionId: string;
  actionName: string;
  actionUnitTime: number;
  actionQtyQuestion: string;
  subTaskCategoryId?: string | null;
}

export type SubTaskPresetApplyTarget = Pick<
  SubTaskFormInput | TemplateSubTaskFormInput,
  | "name"
  | "sharingType"
  | "maxSameTimeWorkers"
  | "expectedTime"
  | "subTaskCategoryId"
>;

export function shouldSearchSubTaskPresets(query: string): boolean {
  return query.trim().length >= SUBTASK_PRESET_MIN_QUERY_LENGTH;
}

export function applySubTaskPreset<T extends SubTaskPresetApplyTarget>(
  current: T,
  preset: SubTaskPreset,
  expectedTime: number,
): T {
  return {
    ...current,
    name: preset.name,
    sharingType: preset.sharingType,
    maxSameTimeWorkers: preset.maxSameTimeWorkers,
    expectedTime,
    subTaskCategoryId: preset.subTaskCategoryId ?? null,
  };
}
