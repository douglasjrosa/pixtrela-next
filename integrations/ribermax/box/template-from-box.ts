import { calculateExpectedTimeFromAction } from "@/lib/actions/default-actions";
import { applyTemplateSubTaskDependencies } from "@/integrations/ribermax/box/template-subtask-dependencies";
import type {
  BoxTemplateData,
  LegacyNumber,
} from "@/integrations/ribermax/rbx/rbx-types";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import type {
  TemplateSubTaskComponentInput,
  TemplateTaskFormInput,
} from "@/lib/schemas/template-task";

export const PRESET_NOT_FOUND_PREFIX = "presetNotFound:";

export function presetNotFoundError(presetName: string): Error {
  return new Error(`${PRESET_NOT_FOUND_PREFIX}${presetName}`);
}

function toNumber(value: LegacyNumber): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toPositiveInt(value: LegacyNumber): number {
  return Math.max(1, Math.round(toNumber(value)));
}

function buildTemplateName(empresaNome: string, boxName: string): string {
  const company = empresaNome.trim();
  const box = boxName.trim();
  return company ? `${company} - ${box}` : box;
}

export function buildTemplateFromBox(
  data: BoxTemplateData,
  presetsByName: ReadonlyMap<string, SubTaskPreset>,
): TemplateTaskFormInput {
  const drafts: TemplateSubTaskComponentInput[] = data.subtasks.map(
    (item, index) => {
      const presetName = item.presetName.trim();
      const preset = presetsByName.get(presetName);
      if (!preset) {
        throw presetNotFoundError(presetName);
      }
      const qty = toPositiveInt(item.qty);
      const actionUnits = toNumber(item.actionUnits);
      return {
        name: preset.name,
        qty,
        sharingType: preset.sharingType,
        maxSameTimeWorkers: preset.maxSameTimeWorkers,
        index,
        expectedTime: calculateExpectedTimeFromAction(
          preset.actionUnitTime,
          actionUnits,
        ),
        dependencies: null,
        subTaskCategoryId: preset.subTaskCategoryId ?? null,
      };
    },
  );

  return {
    name: buildTemplateName(data.empresaNome, data.boxName),
    code: String(data.prodId),
    subTask: applyTemplateSubTaskDependencies(drafts),
  };
}
