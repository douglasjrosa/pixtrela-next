import type { SubTaskPreset } from "@/lib/business/subtask-preset";

export const SAMPLE_ACTION_ID = "11111111-1111-4111-8111-111111111111";

export function sampleSubTaskPreset(
  overrides: Partial<SubTaskPreset> = {},
): SubTaskPreset {
  return {
    documentId: "p1",
    name: "Corte",
    sharingType: "qty",
    maxSameTimeWorkers: 2,
    actionId: SAMPLE_ACTION_ID,
    actionName: "Grampear quadro",
    actionUnitTime: 1,
    actionQtyQuestion: "Quantos grampos serão fixados no total?",
    ...overrides,
  };
}
